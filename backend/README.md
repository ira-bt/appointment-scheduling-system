# MediScheduler - Backend

The backend for the Patient Appointment Booking System, built with Node.js, Express, and TypeScript.

## 🚀 Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Authentication**: JWT with Refresh Token rotation
- **Payments**: Stripe Checkout Integration
- **File Storage**: Cloudinary (via Multer)
- **Emails**: Nodemailer
- **Validation**: Zod
- **Security**: Helmet & CORS

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- Database (PostgreSQL recommended)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   DATABASE_URL="your_prisma_database_url"
   JWT_SECRET="your_access_token_secret"
   JWT_REFRESH_SECRET="your_refresh_token_secret"
   FRONTEND_URL="http://localhost:3000"

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"

   # Stripe
   STRIPE_SECRET_KEY="your_stripe_secret_key"
   STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

   # SMTP
   SMTP_HOST="your_smtp_host"
   SMTP_PORT=587
   SMTP_USER="your_email"
   SMTP_PASS="your_password"
   ```

3. Run Prisma Migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## 📜 Available Scripts

- `npm run dev`: Starts the development server with hot reload.
- `npm run build`: Generates Prisma client and compiles TypeScript to JavaScript.
- `npm run start`: Runs the compiled JS from `dist/`.

## 📂 Project Structure

- `src/controllers`: Request handlers
- `src/routes`: API route definitions
- `src/services`: Business logic (Stripe, Cloudinary, etc.)
- `src/utils`: Helper functions (Validation, Errors, Emails)
- `prisma/`: Database schema and migrations
