# AquaShine Car Wash Booking System

A modern, full-stack car wash booking platform built with React, Node.js, PostgreSQL, and Stripe payment integration.

## 🚗 Features

- **Modern Glass Morphism UI** - Beautiful teal/blue color scheme
- **User Authentication** - JWT-based auth with role management
- **Service Management** - Multiple car wash service tiers
- **Booking System** - Real-time slot availability and booking
- **Payment Processing** - Stripe integration with ZAR currency support
- **Admin Dashboard** - Complete management interface with analytics
- **Review System** - Customer feedback and ratings
- **Responsive Design** - Mobile-first approach

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for routing
- **TanStack Query** for state management
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Vite** for build tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** throughout
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **JWT** authentication
- **Stripe** payment processing
- **bcryptjs** for password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Stripe account (for payments)

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/aquashine
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

3. **Set up the database**
```bash
# Push schema to database
npm run db:push

# Seed with test data
npm run tsx server/seed.ts
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔐 Test Accounts

- **Admin**: admin@aquashine.co.za / admin123
- **Customer**: user@example.com / user123

## 💳 Stripe Test Data

- **Card Number**: 4242 4242 4242 4242
- **Expiry**: Any future date
- **CVC**: Any 3 digits

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Backend API
│   ├── routes.ts          # API route handlers
│   ├── auth.ts            # Authentication middleware
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── seed.ts            # Database seeding
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and validation
└── package.json           # Dependencies and scripts
```

## 🎨 Services

1. **Basic Wash** - R299.99 (30 min)
   - Exterior wash, hand dry, tire shine, basic wax

2. **Premium Wash** - R599.99 (60 min) 
   - Interior & exterior clean, leather treatment, premium wax

3. **Deluxe Detailing** - R1,299.99 (120 min)
   - Paint correction, ceramic coating, deep interior clean

4. **Express Wash** - R149.99 (15 min)
   - Quick exterior wash for maintenance

## 🏗️ Database Schema

- **users** - User accounts and profiles
- **services** - Car wash service definitions  
- **slots** - Available booking time slots
- **bookings** - Customer reservations
- **reviews** - Customer feedback and ratings

## 🌟 Admin Features

- User management
- Service management  
- Booking oversight
- Revenue analytics
- Customer reviews moderation

## 🔒 Security

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection protection via Drizzle ORM
- Role-based access control

## 🚀 Deployment

1. **Build for production**
```bash
npm run build
```

2. **Set production environment variables**
```bash
NODE_ENV=production
DATABASE_URL=your_production_db_url
JWT_SECRET=your_production_secret
```

3. **Start production server**
```bash
npm start
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for modern car wash businesses