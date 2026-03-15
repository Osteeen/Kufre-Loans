# Kufre Loans — Loan Management Platform

A production-grade full-stack loan management platform with a public website, customer portal, and admin portal.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Email | Nodemailer (SMTP) |
| File Upload | Multer (local, Cloudinary-ready) |
| Cron Jobs | node-cron |

---

## Project Structure

```
/
├── client/               # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── public/   # Homepage, Products, About, Contact, Login, Register
│       │   ├── customer/ # Dashboard, Apply, Loan Detail, Profile
│       │   └── admin/    # Dashboard, Loans, Customers, Team, Settings
│       ├── components/
│       │   ├── common/   # Navbar, Footer, StatusBadge, LoadingSpinner, etc.
│       │   └── admin/    # AdminLayout (sidebar)
│       ├── context/      # AuthContext (JWT + user state)
│       └── utils/        # Axios instance, formatNaira, formatDate
│
└── server/               # Node.js/Express backend
    ├── config/
    │   ├── database.js   # PostgreSQL pool
    │   ├── bankAPI.js    # Bank API adapter (Providus-ready stubs)
    │   └── emailService.js
    ├── controllers/      # authController, customerController, adminController
    ├── routes/           # authRoutes, customerRoutes, adminRoutes
    ├── middleware/       # auth (JWT), roleCheck, upload (Multer), validate
    ├── models/           # loanModel (eligibility, schedule generation, tier)
    ├── jobs/             # repaymentEngine.js (daily cron at 08:00)
    └── db/
        ├── schema.js     # Creates all tables
        └── seed.js       # Seeds initial data
```

---

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- A running PostgreSQL instance with a database named `kufre_db`

---

## Setup Instructions

### 1. Clone and install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `.env` with your values. See **Environment Variables** section below.

### 3. Create the database

```bash
# In PostgreSQL:
createdb kufre_db
# or: psql -c "CREATE DATABASE kufre_db;"
```

### 4. Run database schema and seed

```bash
cd server
npm run setup
# This runs: node db/schema.js && node db/seed.js
```

### 5. Start the servers

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open http://localhost:5173

---

## Default Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@kufre.com | Admin@123 |
| Approver | approver@kufre.com | Approver@123 |
| Viewer | viewer@kufre.com | Viewer@123 |
| Customer | customer@kufre.com | Customer@123 |

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/kufre_db` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_SECURE` | Use TLS (true for port 465) | `false` |
| `EMAIL_USER` | SMTP username / email address | `you@gmail.com` |
| `EMAIL_PASS` | SMTP password or App Password | `app-password` |
| `SUPPORT_EMAIL` | Reply-to address in emails | `support@kufre.com` |
| `CLIENT_URL` | Frontend URL (for CORS + email links) | `http://localhost:5173` |
| `BANK_API_BASE_URL` | Providus Bank API base URL | `https://api.providusbank.com/v1` |
| `BANK_CLIENT_ID` | Providus client ID | `your-client-id` |
| `BANK_CLIENT_SECRET` | Providus client secret | `your-client-secret` |
| `CORPORATE_ACCOUNT_NUMBER` | Platform's receiving account | `0000000000` |
| `COMMISSION_RATE` | Fraction of disbursed amount as revenue | `0.01` (= 1%) |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `development` |

---

## API Documentation

All responses follow this format:
```json
{
  "success": true,
  "data": {},
  "message": "Human-readable message"
}
```

All financial amounts are stored in **kobo** (integer). Multiply Naira × 100 before sending; divide by 100 for display.

---

### Auth Endpoints

#### `POST /api/auth/register`
Register a new customer. Triggers virtual account creation via bank API.

**Body:**
```json
{
  "first_name": "Chidi",
  "last_name": "Okafor",
  "email": "chidi@example.com",
  "password": "Password@123",
  "phone": "08012345678",
  "bvn": "12345678901"
}
```
**Response:** `{ token, user: { id, first_name, last_name, email, account_number, bank_name, tier } }`

---

#### `POST /api/auth/login`
**Body:** `{ email, password }`
**Response:** `{ token, user }`

---

#### `POST /api/auth/forgot-password`
**Body:** `{ email }`
Sends a password reset link to the email address.

---

#### `POST /api/auth/reset-password`
**Body:** `{ token, password }`

---

### Customer Endpoints
All require `Authorization: Bearer <token>` and `role: customer`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/dashboard` | Account info, active loan, next repayment, notifications |
| GET | `/api/customer/eligibility` | Tier and max borrowable amount |
| POST | `/api/customer/loans/apply` | Submit loan application (multipart/form-data) |
| GET | `/api/customer/loans` | All loans for current user |
| GET | `/api/customer/loans/:id` | Loan detail + repayment summary |
| GET | `/api/customer/loans/:id/repayments` | Full repayment schedule |
| GET | `/api/customer/messages/:loanId` | Messages for a loan |
| POST | `/api/customer/messages/:loanId` | Send message to admin |
| GET | `/api/customer/notifications` | All notifications |
| PUT | `/api/customer/notifications/read` | Mark all notifications as read |

**Loan application body (multipart/form-data):**
```
product_id, amount_requested (kobo), tenor_months, purpose, documents[] (files)
```

---

### Admin Endpoints
All require `Authorization: Bearer <token>` and role in `[super_admin, approver, viewer]`.

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/admin/dashboard` | all | Stats, recent applications, alerts |
| GET | `/api/admin/loans` | all | All loans with filters (status, search, date, page) |
| GET | `/api/admin/loans/:id` | all | Full loan detail |
| PUT | `/api/admin/loans/:id/approve` | super_admin, approver | Approve with amount + rate |
| PUT | `/api/admin/loans/:id/decline` | super_admin, approver | Decline with reason |
| PUT | `/api/admin/loans/:id/disburse` | super_admin, approver | Disburse to customer account |
| GET | `/api/admin/messages/:loanId` | all | Messages for a loan |
| POST | `/api/admin/messages/:loanId` | super_admin, approver | Send message to customer |
| GET | `/api/admin/users` | all | All customers (search, paginate) |
| GET | `/api/admin/users/:id` | all | Customer detail + loan history |
| POST | `/api/admin/team` | super_admin | Create approver or viewer account |
| GET | `/api/admin/team` | all | List team members |
| PUT | `/api/admin/settings` | super_admin | Update interest rate, tier limits |

---

## Loan Tier Logic

| Tier | Criteria | Max Amount |
|------|----------|------------|
| 1 | New customer, no previous loans | `tier1_max_amount` (default ₦500,000) |
| 2 | 1+ completed loan, perfect repayment history | `tier2_max_amount` (default ₦1,500,000) |
| 3+ | 2+ completed loans, perfect history | `tier3_max_amount` (default ₦5,000,000), grows progressively |

A customer with an active (approved/disbursed) loan is **not eligible** for a new loan.

---

## Repayment Schedule

**Flat interest model:**
- Interest per month = `(approved_amount × interest_rate) / 100`
- Principal per month = `approved_amount / tenor_months`
- Total per month = principal + interest
- Due dates = `disbursed_at + (month_number × 30 days)`

---

## Cron Job — Repayment Engine

File: `server/jobs/repaymentEngine.js`

Runs daily at **08:00 AM**. For each due repayment:
1. Debits principal from customer account
2. Debits interest from customer account
3. Credits corporate account with total
4. On success: marks paid, emails customer
5. On failure: marks failed, emails customer + admin
6. When all repayments paid: marks loan completed, recalculates tier

---

## Bank API Adapter

File: `server/config/bankAPI.js`

Currently **stubbed** with mock responses. Each method has a comment indicating the real Providus endpoint it maps to. To go live:
1. Add `BANK_API_BASE_URL`, `BANK_CLIENT_ID`, `BANK_CLIENT_SECRET` to `.env`
2. Replace the stub implementation in each method with a real `axios` call to Providus
3. No other files need to change

---

## Role Permissions

| Action | super_admin | approver | viewer | customer |
|--------|-------------|----------|--------|----------|
| View loans | ✓ | ✓ | ✓ | own only |
| Approve/Decline | ✓ | ✓ | ✗ | ✗ |
| Disburse | ✓ | ✓ | ✗ | ✗ |
| Message customers | ✓ | ✓ | ✗ | ✓ |
| Manage team | ✓ | ✗ | ✗ | ✗ |
| Update settings | ✓ | ✗ | ✗ | ✗ |
| Apply for loan | ✗ | ✗ | ✗ | ✓ |

---

## Security

- Passwords hashed with bcrypt (salt rounds: 12)
- JWT required on all protected routes
- Role middleware enforced on every admin action
- BVN never returned in any API response
- All input validated with `express-validator`
- Rate limiting on auth routes: 15 requests / 15 minutes
- CORS restricted to `CLIENT_URL`

---

## Going to Production

1. Replace in-memory password reset token store (in `authController.js`) with Redis
2. Replace bank API stubs in `config/bankAPI.js` with real Providus credentials
3. Replace local Multer uploads with Cloudinary (`CLOUDINARY_URL` env var already defined)
4. Set `NODE_ENV=production` and use a strong `JWT_SECRET`
5. Run behind a reverse proxy (nginx) with HTTPS
6. Set up PM2 or a process manager for the Node server
