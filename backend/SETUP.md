# Backend Setup for Supabase

This guide will help you set up the backend to work with Supabase PostgreSQL database.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Node.js installed (v18 or higher)
3. npm or yarn package manager

## Step 1: Get Your Supabase Connection Details

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find the **Connection string** section
4. Copy the **URI** connection string (it looks like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)

**Important**: For Prisma migrations, you need the **Direct connection** string:
- Go to **Settings** → **Database** → **Connection string**
- Select **URI** tab
- Use the **Direct connection** (port 5432) for migrations
- Format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# Supabase PostgreSQL Direct Connection (for Prisma)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Optional: Direct URL for migrations (if different from DATABASE_URL)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase API Configuration
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Replace:**
- `[YOUR-PASSWORD]` with your database password
- `[PROJECT-REF]` with your Supabase project reference ID

## Step 3: Install Dependencies

```bash
cd backend
npm install
```

## Step 4: Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client based on your schema.

## Step 5: Run Database Migrations

Create the database tables:

```bash
npm run prisma:migrate
```

When prompted, give your migration a name (e.g., "init_referral_system").

This will:
- Create the `Referral` table in your Supabase database
- Create all necessary indexes
- Set up the database schema

## Step 6: Verify Database Setup

Test the database connection:

```bash
npm run db:setup
```

This will verify that:
- The connection to Supabase works
- The Referral table exists
- Everything is configured correctly

## Step 7: Start the Server

```bash
npm run dev
```

The server should start and show:
```
✓ Supabase client initialized
Server running on port 3001
✓ Database connected (Supabase PostgreSQL)
```

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check your DATABASE_URL format:**
   - Must start with `postgresql://`
   - Include password (URL encoded if special characters)
   - Use port 5432 for direct connection
   - Include `?pgbouncer=true&connection_limit=1` for Supabase

2. **Verify Supabase is running:**
   - Check your Supabase project dashboard
   - Ensure the database is not paused

3. **Check firewall/network:**
   - Supabase allows connections from anywhere by default
   - If using IP restrictions, add your IP to allowed list

### Migration Issues

If migrations fail:

1. **Use direct connection for migrations:**
   - Set `DIRECT_URL` in `.env` to the direct connection (port 5432)
   - Prisma will use this for migrations

2. **Reset database (⚠️ deletes all data):**
   ```bash
   npm run db:reset
   ```

### Prisma Client Issues

If you get "Prisma Client not generated" errors:

```bash
npm run prisma:generate
```

## Additional Commands

- `npm run prisma:studio` - Open Prisma Studio to view/edit data
- `npm run prisma:migrate:deploy` - Deploy migrations (for production)
- `npm run db:reset` - Reset database (⚠️ deletes all data)

## Production Notes

For production:

1. Use environment-specific `.env` files
2. Use connection pooling (Supabase provides pooled connections)
3. Set `NODE_ENV=production`
4. Use `prisma migrate deploy` instead of `prisma migrate dev`

