# Authentication & Referral System Integration

## Overview
Complete authentication system (signup/login) has been integrated with the referral system. Users can now sign up with referral codes, and the system will show toast notifications when referral links are clicked.

## Features Implemented

### Backend
1. **User Model** - Added to Prisma schema with email, password (hashed), name, and tier
2. **Authentication Routes** (`/api/auth`):
   - `POST /signup` - User registration with optional referral code
   - `POST /login` - User login
   - `GET /me` - Get current user info
   - `GET /validate-referral/:code` - Validate referral code and return info
3. **JWT Authentication** - Token-based authentication using `jsonwebtoken`
4. **Password Hashing** - Using `bcryptjs` for secure password storage
5. **Referral Integration** - When a user signs up with a referral code:
   - Referral is marked as "verified"
   - Referrer gets notified
   - New referral link is auto-generated for the referrer

### Frontend
1. **Authentication Pages**:
   - `/signup` - Signup page with referral code support
   - `/login` - Login page
   - `/referral/:code` - Landing page when referral link is clicked
2. **Toast Notifications** - Using `react-hot-toast`:
   - Success toasts for successful actions
   - Error toasts for errors
   - Special referral toasts with emojis
3. **Auth Context** - Global authentication state management
4. **Protected Routes** - Dashboard requires authentication
5. **Rewards Display** - Dashboard shows when users will be awarded

## Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Database Migration

**Important:** The schema has optional relations for Referral model to handle existing data. If you have existing referrals, you may need to:

1. Run the migration:
```bash
cd backend
npx prisma migrate dev --name add_user_authentication
```

2. If migration fails due to existing data, you can:
   - Option A: Reset the database (WARNING: This will delete all data):
     ```bash
     npx prisma migrate reset --force
     ```
   - Option B: Create placeholder users for existing referrals:
     ```bash
     node scripts/migrate-with-users.js
     ```

3. Generate Prisma client:
```bash
npx prisma generate
```

### 3. Environment Variables

Add to `backend/.env`:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### 4. Start Servers

**Backend:**
```bash
cd backend
npm run start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Usage Flow

1. **User clicks referral link** (`/referral/:code`):
   - Landing page validates the referral code
   - Shows toast notification: "🎉 Referral link detected! Sign up to get rewarded..."
   - User can click "Sign Up to Get Rewarded"

2. **User signs up with referral code**:
   - Referral code is automatically filled from URL (`?ref=CODE`)
   - On successful signup:
     - Referral is marked as "verified"
     - Toast shows: "🎉 Referral link used successfully! You will be awarded when you make a purchase."
     - User is redirected to dashboard

3. **Dashboard shows rewards**:
   - If user has verified referrals, a green banner appears:
     - "You've Been Awarded!"
     - Shows count of verified referrals
     - Shows total earnings if any
     - Message: "You will be awarded when you make a purchase"

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Sign up
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "referralCode": "ABC123" // optional
  }
  ```

- `POST /api/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/me` - Get current user (requires Bearer token)

- `GET /api/auth/validate-referral/:code` - Validate referral code

## Notes

- The referral relations in the schema are optional (`User?`) to handle existing data. You can make them required later after migrating existing referrals.
- JWT tokens are stored in localStorage on the frontend
- All protected routes require a valid JWT token in the `Authorization: Bearer <token>` header
- The system automatically generates a new referral link for referrers after their link is used

