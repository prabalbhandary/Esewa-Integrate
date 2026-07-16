import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import CryptoJS from 'crypto-js'
import morgan from "morgan"

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors({
    origin: ["http://localhost:5173"]
}))
app.use(express.json())
app.use(morgan("dev"))

app.post("/signature", async (req, res) => {
    try {
        const {total_amount,transaction_uuid,product_code} = req.body
        const hashedString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`
        const sign = CryptoJS.HmacSHA256(hashedString, process.env.ESEWA_SECRET)
        const signature = CryptoJS.enc.Base64.stringify(sign)
        return res.status(200).json({signature})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

app.post("/verify", async (req, res) => {
    try {
        const {total_amount,transaction_uuid,product_code} = req.body
        const response = await fetch(`https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`)
        const result = await response.json()
        if(result.status === "COMPLETE"){
            return res.status(200).json({success: true, result})
        }
        return res.status(400).json({success: false, result})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})