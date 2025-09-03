# AquaShine Car Wash Service

## Overview

AquaShine is a modern car wash service booking platform built with a full-stack TypeScript architecture. The application features a React frontend with a Node.js/Express backend, offering customers the ability to browse services, book appointments, and leave reviews. The platform includes both customer-facing features and an administrative dashboard for managing services, bookings, and operations.

## User Preferences

Preferred communication style: Simple, everyday language.
Database preference: MongoDB for local development

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Custom component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system featuring glass morphism effects
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture with structured route handlers
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot reload with tsx for development server

### Authentication System
- **Provider**: Replit OpenID Connect (OIDC) integration
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Management**: Express sessions with PostgreSQL/MongoDB store
- **Authorization**: Role-based access control (user/admin roles)

### Database Architecture
- **Database**: Dual support - PostgreSQL (Replit) / MongoDB (Local)
- **ORM**: Drizzle ORM (PostgreSQL) / Mongoose (MongoDB) for type-safe operations
- **Schema**: Relational design with users, services, slots, bookings, and reviews
- **Migrations**: Drizzle Kit (PostgreSQL) / Mongoose schemas (MongoDB)

### Data Models
- **Users**: Authentication data, profile information, and role management
- **Services**: Car wash service definitions with pricing and duration
- **Slots**: Available time slots for service bookings
- **Bookings**: Customer reservations with vehicle information
- **Reviews**: Customer feedback and ratings system
- **Sessions**: Secure session storage for authentication

### Component Architecture
- **Design System**: Glass morphism theme with consistent spacing and typography
- **Reusable Components**: Modular UI components (ServiceCard, ReviewCard, BookingModal)
- **Layout Components**: Navigation, Footer, and admin sidebar
- **Form Handling**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Business Logic
- **Service Categories**: Basic wash, premium, and detailing tiers
- **Booking System**: Time slot management with availability tracking
- **Vehicle Information**: Comprehensive vehicle data collection
- **Review System**: Rating and comment functionality
- **Admin Dashboard**: Complete service and booking management

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database connectivity (Replit)
- **mongoose**: MongoDB object modeling and validation (Local)
- **drizzle-orm**: Type-safe database ORM and query builder (PostgreSQL)
- **connect-mongo**: MongoDB session store for Express (Local)
- **passport**: Authentication middleware framework
- **openid-client**: OpenID Connect authentication

### UI and Styling
- **@radix-ui/***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional CSS class utility

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

### State Management
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers

### Payment Processing
- **@stripe/stripe-js**: Stripe payment integration
- **@stripe/react-stripe-js**: React components for Stripe

### Utilities
- **date-fns**: Date manipulation and formatting
- **zod**: Runtime type validation and schema definition
- **memoizee**: Function memoization for performance optimization

## Database Implementation

The project includes complete implementations for both databases:

### PostgreSQL (Replit Environment)
- Files: `shared/schema.ts`, `server/storage.ts`, `server/routes.ts`, `server/replitAuth.ts`
- Used for Replit deployment with Neon serverless PostgreSQL
- Drizzle ORM with type-safe operations

### MongoDB (Local Development) 
- Files: `shared/mongoose-schema.ts`, `server/mongodb-storage.ts`, `server/mongodb-routes.ts`, `server/mongodb-auth.ts`, `server/mongodb.ts`
- Used for local development with MongoDB
- Mongoose ODM with schema validation
- Complete feature parity with PostgreSQL implementation

### Switching Between Databases
To use MongoDB locally, update `server/index.ts`:
1. Change imports to use `mongodb-routes` instead of `routes`
2. Add MongoDB connection call
3. Set `MONGODB_URI` environment variable
4. Run seed script: `npm run tsx server/mongodb-seed.ts`