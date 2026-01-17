# Director Dashboard & Commission System Setup

## Overview
Complete Director dashboard has been implemented to view all commissions and earnings across all users. The system now includes:
- Purchase endpoint to trigger commission calculation
- Commission ledger tracking
- Director role-based access control
- Comprehensive admin dashboard

## Features Implemented

### Backend

1. **User Role System**
   - Added `role` field to User model (default: "user")
   - Roles: `user`, `director`, `admin`
   - Role-based access control middleware

2. **Purchase Endpoint** (`POST /api/purchase`)
   - Records a purchase and automatically calculates commissions
   - Validates user has completed registration via referral
   - Triggers commission calculation for all layers in referral chain
   - Stores commissions in CommissionLedger

3. **Admin/Director Routes** (`/api/admin`)
   - `GET /users` - Get all users with stats
   - `GET /commissions` - Get all commissions with filters
   - `GET /stats` - Get overall statistics
   - `GET /user/:userId` - Get detailed user stats

4. **Commission Calculation**
   - Automatically calculates commissions when purchase is made
   - Supports multi-layer commission structure (Layer 1: 12%, Layer 2: 8%, Layer 3: 4%)
   - Stores in CommissionLedger with full details

### Frontend

1. **Director Dashboard** (`/director`)
   - Overview tab: Overall statistics, top earners, commissions by layer
   - Users tab: All users with their earnings and referral stats
   - Commissions tab: All commission transactions with details
   - Role-based access (only director/admin can access)

2. **Purchase Simulator**
   - Component in Referral Dashboard to simulate purchases
   - Triggers commission calculation
   - Shows success message with commission details

## Setup Instructions

### 1. Database Migration

The migration has been created. Run:
```bash
cd backend
npx prisma generate
```

### 2. Create Director User

To create a director user, you can either:

**Option A: Update existing user via database:**
```sql
UPDATE "User" SET role = 'director' WHERE email = 'your-email@example.com';
```

**Option B: Create via signup and update:**
1. Sign up normally
2. Update the user's role in the database to 'director'

**Option C: Use Prisma Studio:**
```bash
cd backend
npx prisma studio
```
Then update the user's role field to 'director'

### 3. Testing Commission System

1. **Create referral chain:**
   - User A signs up (no referral)
   - User B signs up with User A's referral code
   - User C signs up with User B's referral code
   - User D signs up with User C's referral code

2. **Make a purchase:**
   - Login as User D (the one who made the purchase)
   - Go to dashboard
   - Use the "Purchase Simulator" component
   - Enter an amount (e.g., $100)
   - Click "Record Purchase"

3. **Check commissions:**
   - Commissions will be calculated for:
     - User C (Layer 1): 12% = $12
     - User B (Layer 2): 8% = $8
     - User A (Layer 3): 4% = $4
   - Total: $24 in commissions

4. **View in Director Dashboard:**
   - Login as director
   - Go to `/director`
   - View all commissions in the "All Commissions" tab
   - See user earnings in the "All Users" tab

## API Endpoints

### Purchase
- `POST /api/purchase`
  ```json
  {
    "amount": 100.00,
    "description": "Product purchase"
  }
  ```

### Admin (Director Only)
- `GET /api/admin/users` - All users with stats
- `GET /api/admin/commissions?limit=100&userId=xxx` - All commissions
- `GET /api/admin/stats` - Overall statistics
- `GET /api/admin/user/:userId` - User details

## Commission Calculation Logic

1. **When a purchase is made:**
   - System finds the referral chain upward from the purchaser
   - Calculates commissions for each layer based on tier depth limit
   - Gold tier: max 3 layers
   - Silver tier: max 2 layers
   - Bronze tier: max 1 layer

2. **Commission Rates:**
   - Layer 1: 12%
   - Layer 2: 8%
   - Layer 3: 4%

3. **Storage:**
   - Each commission is stored in CommissionLedger
   - Includes: userId, referralId, layer, amount, purchaseAmount, commissionRate

## Notes

- Commissions are only calculated if the purchaser has a verified referral
- Director dashboard requires `director` or `admin` role
- Purchase endpoint requires authentication
- All commission data is stored permanently in CommissionLedger table

