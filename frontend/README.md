# MediScheduler - Frontend

The frontend for the Patient Appointment Booking System, a modern React application built with Next.js and Tailwind CSS.

## 🎨 Design & UI

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS & DaisyUI
- **Icons**: Lucide React
- **Themes**: Modern, high-contrast, mobile-responsive design

## ⚡ Core Technologies

- **Language**: TypeScript
- **State Management**: Zustand
- **HTTP Client**: Axios with Token Refresh interceptors
- **Visuals**: Recharts for analytics dashboard
- **Toast**: React Hot Toast
- **Dates**: Date-fns

## 🛠️ Getting Started

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_pub_key"
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## ✨ Key Features

- **Auth System**: Login/Register with Patient and Doctor roles.
- **Doctor Discovery**: Advanced filtering by city and specialty.
- **Booking Flow**: Real-time slot availability and collision detection.
- **Dashboards**: 
  - **Patient**: Booking history, reports upload, and profile management.
  - **Doctor**: Appointment management, analytics, and availability settings.
- **Payment Integration**: Secure Stripe checkout for consultation fees.

## 📱 Mobile Responsiveness

The application is audited for small screens (down to 320px) with dedicated mobile drawers and space-saving UI components.
