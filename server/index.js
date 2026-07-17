import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import CryptoJS from 'crypto-js'
import morgan from "morgan"
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 3000

app.use(cors({
    origin: ["http://localhost:5173"]
}))
app.use(express.json())
app.use(morgan("dev"))

const db = new Database(path.join(__dirname, 'database.sqlite'))

db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS payment_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        transaction_uuid TEXT NOT NULL,
        amount REAL NOT NULL,
        product_code TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        esewa_status TEXT,
        esewa_response TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id)
    )
`)

const updateSaleTimestamp = db.prepare(`UPDATE sales SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
const updatePaymentTimestamp = db.prepare(`UPDATE payment_attempts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`)

const createSale = db.prepare(`INSERT INTO sales (total_amount) VALUES (?) RETURNING *`)
const createPaymentAttempt = db.prepare(`INSERT INTO payment_attempts (sale_id, transaction_uuid, amount, product_code) VALUES (?, ?, ?, ?) RETURNING *`)
const getSale = db.prepare(`SELECT * FROM sales WHERE id = ?`)
const getPaymentAttemptByUuid = db.prepare(`SELECT * FROM payment_attempts WHERE transaction_uuid = ?`)
const updatePaymentStatus = db.prepare(`UPDATE payment_attempts SET status = ?, esewa_status = ?, esewa_response = ? WHERE id = ?`)
const updateSaleStatus = db.prepare(`UPDATE sales SET status = ? WHERE id = ?`)

app.post("/api/sales", async (req, res) => {
    try {
        const { total_amount } = req.body
        const amount = Number(total_amount).toFixed(2)
        
        const sale = createSale.get(amount)
        updateSaleTimestamp.run(sale.id)
        
        return res.status(201).json({
            id: sale.id,
            total_amount: sale.total_amount,
            status: sale.status,
            created_at: sale.created_at
        })
    } catch (error) {
        console.error("Create sale error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

app.post("/api/sales/:id/payment", async (req, res) => {
    try {
        const saleId = req.params.id
        const sale = getSale.get(saleId)
        
        if (!sale) {
            return res.status(404).json({ message: "Sale not found" })
        }
        
        if (sale.status === "paid") {
            return res.status(400).json({ message: "Sale is already paid" })
        }
        
        const { product_code } = req.body
        const transactionUuid = crypto.randomUUID()
        const totalAmount = Number(sale.total_amount).toFixed(2)
        
        const paymentAttempt = createPaymentAttempt.get(saleId, transactionUuid, totalAmount, product_code || "EPAYTEST")
        updatePaymentTimestamp.run(paymentAttempt.id)
        
        const hashedString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${paymentAttempt.product_code}`
        const sign = CryptoJS.HmacSHA256(hashedString, process.env.ESEWA_SECRET)
        const signature = CryptoJS.enc.Base64.stringify(sign)
        
        const callbackBase = process.env.ESEWA_CALLBACK_BASE_URL || `http://localhost:${port}`
        const callbackUrl = `${callbackBase}/api/esewa/callback?sale_id=${saleId}&payment_id=${paymentAttempt.id}`
        
        const formData = {
            amount: totalAmount,
            failure_url: callbackUrl,
            product_delivery_charge: "0",
            product_service_charge: "0",
            product_code: paymentAttempt.product_code,
            signature: signature,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            success_url: callbackUrl,
            tax_amount: "0",
            total_amount: totalAmount,
            transaction_uuid: transactionUuid,
        }
        
        return res.status(200).json({
            sale_id: sale.id,
            payment_id: paymentAttempt.id,
            form_data: formData,
            esewa_url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
        })
    } catch (error) {
        console.error("Create payment error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

app.post("/api/esewa/callback", async (req, res) => {
    try {
        const { sale_id, payment_id } = req.query
        const body = req.body
        
        console.log("eSewa callback received:", { sale_id, payment_id, body })
        
        const paymentAttempt = db.prepare(`SELECT * FROM payment_attempts WHERE id = ?`).get(payment_id)
        
        if (!paymentAttempt) {
            return res.status(404).json({ message: "Payment attempt not found" })
        }
        
        const esewaStatus = body.status || "UNKNOWN"
        let paymentStatus = "pending"
        let saleStatus = "pending"
        
        if (esewaStatus === "COMPLETE") {
            paymentStatus = "complete"
            saleStatus = "paid"
        } else {
            paymentStatus = "failed"
            saleStatus = "failed"
        }
        
        updatePaymentStatus.run(paymentStatus, esewaStatus, JSON.stringify(body), payment_id)
        updateSaleStatus.run(saleStatus, sale_id)
        
        console.log(`Payment ${payment_id} marked as ${paymentStatus}, sale ${sale_id} marked as ${saleStatus}`)
        
        if (saleStatus === "paid") {
            console.log(`Sale ${sale_id} is PAID - inventory, accounting, and receipt would be posted here`)
        }
        
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
        const redirectUrl = saleStatus === "paid" 
            ? `${frontendUrl}/success?sale_id=${sale_id}` 
            : `${frontendUrl}/failure?sale_id=${sale_id}&reason=${encodeURIComponent(`Payment ${esewaStatus}`)}`
        
        return res.redirect(redirectUrl)
    } catch (error) {
        console.error("Callback error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

app.get("/api/sales/:id", async (req, res) => {
    try {
        const saleId = req.params.id
        const sale = getSale.get(saleId)
        
        if (!sale) {
            return res.status(404).json({ message: "Sale not found" })
        }
        
        const paymentAttempts = db.prepare(`SELECT * FROM payment_attempts WHERE sale_id = ? ORDER BY created_at DESC`).all(saleId)
        
        return res.status(200).json({
            ...sale,
            payment_attempts: paymentAttempts
        })
    } catch (error) {
        console.error("Get sale error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

app.post("/api/esewa/verify", async (req, res) => {
    try {
        const { total_amount, transaction_uuid, product_code } = req.body
        const response = await fetch(`https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`)
        const result = await response.json()
        
        if (result.status === "COMPLETE") {
            return res.status(200).json({ success: true, result })
        }
        return res.status(400).json({ success: false, result })
    } catch (error) {
        console.error("Verify error:", error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
