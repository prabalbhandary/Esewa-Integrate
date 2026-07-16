# Esewa Payment Integration

A full-stack payment integration demo using eSewa's payment gateway with a React frontend and Express.js backend.

## Features

- eSewa payment form integration
- HMAC-SHA256 signature generation
- Transaction status verification
- Loading, Success, and Failure pages
- Responsive UI with TailwindCSS

## Tech Stack

**Frontend:**
- React 19
- Vite
- TailwindCSS 4
- React Router DOM 7
- UUID

**Backend:**
- Express.js
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
│   └── .env
└── README.md
```

## How It Works

1. **Signature Generation**: The client sends `total_amount`, `transaction_uuid`, and `product_code` to the backend, which generates an HMAC-SHA256 signature using the eSewa secret key.

2. **Payment Form**: The client creates a hidden form with all required eSewa fields and submits it to `https://rc-epay.esewa.com.np/api/epay/main/v2/form`.

3. **Callback Handling**: eSewa redirects back to the success or failure URL with transaction data.

4. **Verification**: The success page parses the callback data, sends it to the backend `/verify` endpoint, and displays the transaction result.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signature` | Generates HMAC-SHA256 signature for payment |
| POST | `/verify` | Verifies transaction status with eSewa |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ESEWA_SECRET` | eSewa secret key for signature generation | - |
| `PORT` | Server port | `3000` |

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

## License

ISC
