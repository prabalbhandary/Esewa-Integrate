# Esewa Payment Integration

A full-stack payment integration demo using eSewa's payment gateway with a React POS frontend and Express.js backend.

## Architecture

This app follows the proper backend-driven eSewa payment flow:

```
POS Checkout
    ↓
Backend creates/finalizes sale
    ↓
Backend calculates authoritative total
    ↓
Backend creates payment attempt
    ↓
Backend generates eSewa signature
    ↓
Customer completes eSewa payment
    ↓
eSewa returns callback to backend
    ↓
Backend verifies callback and status
    ↓
Database marks payment complete / failed
    ↓
If complete: Sale becomes paid, inventory/accounting/receipt posted
If failed: No further action
```

## Tech Stack

**Frontend:**
- React 19
- Vite
- TailwindCSS 4
- React Router DOM 7

**Backend:**
- Express.js
- SQLite (better-sqlite3)
- CryptoJS
- CORS
- Morgan
- Dotenv
- Nodemon

## Prerequisites

- Node.js (v18+)
- npm or yarn
- eSewa merchant account (for production)

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd esewa-integrate
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
ESEWA_SECRET=your_eSewa_secret_key
PORT=3000
ESEWA_CALLBACK_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

> **Note:** For production, use your actual eSewa secret key. For testing, eSewa provides a test secret key.

Start the backend server:

```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
esewa-integrate/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Loader.jsx
│   │   ├── pages/
│   │   │   ├── Success.jsx
│   │   │   └── Failure.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── index.js
│   ├── package.json
│   ├── .env
│   └── database.sqlite
└── README.md
```

## How It Works

1. **POS Checkout**: User enters amount and clicks "Pay with eSewa"
2. **Create Sale**: Frontend calls `POST /api/sales` → backend creates sale in database
3. **Create Payment**: Frontend calls `POST /api/sales/:id/payment` → backend creates payment attempt, generates HMAC-SHA256 signature, returns form data
4. **Submit to eSewa**: Frontend submits hidden form to eSewa
5. **Callback**: eSewa POSTs to backend `/api/esewa/callback`
6. **Verification**: Backend verifies payment status with eSewa API
7. **Update Database**: Backend marks payment as `complete` or `failed`, updates sale status to `paid` or `failed`
8. **Post-Processing**: If paid, inventory, accounting, and receipt are posted (logged in console)
9. **Redirect**: Backend redirects to frontend `/success?sale_id=X` or `/failure?sale_id=X`
10. **Poll Status**: Success page polls `GET /api/sales/:id` to confirm final status

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sales` | Creates a new sale |
| POST | `/api/sales/:id/payment` | Creates payment attempt, returns eSewa form data |
| POST | `/api/esewa/callback` | eSewa callback endpoint (server-to-server) |
| GET | `/api/sales/:id` | Gets sale status with payment attempts |
| POST | `/api/esewa/verify` | Verifies transaction status with eSewa |

## Database Schema

**sales**
- `id` - Primary key
- `total_amount` - Authoritative total
- `status` - `pending`, `paid`, `failed`
- `created_at` - Timestamp
- `updated_at` - Timestamp

**payment_attempts**
- `id` - Primary key
- `sale_id` - Foreign key to sales
- `transaction_uuid` - eSewa transaction UUID
- `amount` - Payment amount
- `product_code` - eSewa product code
- `status` - `pending`, `complete`, `failed`
- `esewa_status` - Raw status from eSewa
- `esewa_response` - Full eSewa response
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ESEWA_SECRET` | eSewa secret key for signature generation | - |
| `PORT` | Server port | `3000` |
| `ESEWA_CALLBACK_BASE_URL` | Base URL for eSewa callbacks | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost:5173` |

## Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Server
- `npm start` - Start server with Nodemon

## Testing

eSewa provides a sandbox environment for testing. The current configuration uses:
- **Product Code**: `EPAYTEST`
- **Environment**: `rc-epay.esewa.com.np` (replica/testing)

### Troubleshooting

**409 Conflict - "Service is currently unavailable"**
- This is a **known, intermittent issue** with eSewa's sandbox environment
- Your code is correct - the signature is generated properly and the form is submitted correctly
- Retry after waiting 5-10 minutes

**Callback not received**
- For local development, ensure `ESEWA_CALLBACK_BASE_URL` is set correctly
- In production, use your public API URL for callbacks
- The callback endpoint must be publicly accessible for eSewa to reach it

## License

ISC
