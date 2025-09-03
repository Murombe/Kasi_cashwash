# MongoDB Setup Instructions for Local Development

This project includes a complete MongoDB implementation alongside the PostgreSQL setup for Replit. When deploying locally, you can choose to use MongoDB instead of PostgreSQL.

## Files Included for MongoDB

The following files are included for MongoDB implementation:

### Database & Connection
- `server/mongodb.ts` - MongoDB connection setup
- `shared/mongoose-schema.ts` - Mongoose schemas for all data models

### Storage & Authentication
- `server/mongodb-storage.ts` - MongoDB storage implementation
- `server/mongodb-auth.ts` - Authentication with MongoDB session storage
- `server/mongodb-routes.ts` - API routes using MongoDB storage

### Utilities
- `server/mongodb-seed.ts` - Database seeding script with sample data

## Setup Instructions

### 1. Install and Start MongoDB

**Option A: Using MongoDB Community Edition**
```bash
# On Ubuntu/Debian
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# On macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# On Windows
# Download and install from https://www.mongodb.com/try/download/community
```

**Option B: Using Docker**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

### 2. Install MongoDB Dependencies

The required packages are already included in package.json:
- `mongoose` - MongoDB object modeling
- `connect-mongo` - MongoDB session store for Express
- `@types/mongoose` - TypeScript types

If you need to install them separately:
```bash
npm install mongoose connect-mongo @types/mongoose
```

### 3. Update Server Configuration

To switch to MongoDB, edit `server/index.ts`:

```typescript
// Change imports from:
import { registerRoutes } from "./routes";

// To:
import { registerRoutes } from "./mongodb-routes";
import { connectMongoDB } from "./mongodb";

// Add MongoDB connection in the async function:
(async () => {
  // Connect to MongoDB
  await connectMongoDB();
  
  const server = await registerRoutes(app);
  // ... rest of the code
})();
```

### 4. Environment Variables

Create a `.env` file (or update existing one) with MongoDB configuration:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/aquashine

# Keep existing Replit/Stripe variables
SESSION_SECRET=your_session_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### 5. Seed the Database

Run the seed script to populate MongoDB with sample data:

```bash
npm run tsx server/mongodb-seed.ts
```

This will create:
- 6 sample car wash services with ZAR pricing
- Time slots for the next 30 days
- An admin user account

### 6. Start the Application

```bash
npm run dev
```

The application will now use MongoDB instead of PostgreSQL.

## Key Differences from PostgreSQL Setup

### Schema Definition
- Uses Mongoose schemas with TypeScript interfaces
- Automatic timestamp management (createdAt, updatedAt)
- Built-in validation and type safety

### Storage Operations
- Native MongoDB operations with Mongoose ORM
- Automatic relationship population
- Flexible querying with MongoDB query syntax

### Session Storage
- Uses `connect-mongo` for session persistence
- Automatic session cleanup and TTL management

### Authentication
- Same Replit OIDC integration
- MongoDB-backed session storage
- User data stored in MongoDB collections

## Switching Between Databases

To switch back to PostgreSQL (for Replit deployment):

1. Revert `server/index.ts` to use `./routes` instead of `./mongodb-routes`
2. Remove MongoDB connection call
3. Ensure PostgreSQL environment variables are set

For local development with different databases, you can maintain separate configuration files or use environment variables to determine which database to use.

## Data Models

All data models are maintained in both formats:
- `shared/schema.ts` - Drizzle/PostgreSQL schemas
- `shared/mongoose-schema.ts` - Mongoose/MongoDB schemas

Both provide the same TypeScript types and validation, ensuring consistency across database implementations.

## Admin User

A default admin user is created during seeding:
- **Email**: admin@aquashine.co.za
- **Role**: admin
- **Access**: Full dashboard, user management, analytics

## South African Rand (ZAR) Support

All pricing is configured for South African Rand:
- Service prices in ZAR (R149.99, R299.99, etc.)
- Stripe payments in ZAR currency
- Proper currency formatting throughout the application

## Production Considerations

For production MongoDB deployment:
- Use MongoDB Atlas or a managed MongoDB service
- Update `MONGODB_URI` to point to your production database
- Enable authentication and SSL
- Configure proper backup and monitoring
- Use connection pooling for performance

The application maintains full feature parity between PostgreSQL and MongoDB implementations, including:
- User authentication and roles
- Service and booking management
- Payment processing (cash/card)
- Analytics and reporting
- Admin dashboard functionality