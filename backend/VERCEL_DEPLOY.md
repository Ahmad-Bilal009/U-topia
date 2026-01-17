# Backend Deployment to Vercel

This backend folder is configured for standalone deployment to Vercel.

## Files Created

- `vercel.json` - Vercel configuration for serverless functions
- `api/index.js` - Serverless function wrapper for Express app
- `.vercelignore` - Files to exclude from deployment
- `package.json` - Updated with `vercel-build` script

## Deployment Steps

### 1. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables and add:

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `JWT_SECRET` - Secret for JWT token signing
- `FRONTEND_URL` - Your frontend domain (for CORS)
- `NODE_ENV=production`

### 2. Deploy

**Option A: Via Vercel Dashboard**
1. Connect your repository
2. Set Root Directory to `backend`
3. Vercel will auto-detect `vercel.json`
4. Deploy

**Option B: Via Vercel CLI**
```bash
cd backend
vercel --prod
```

## Build Process

When Vercel builds:
1. Runs `npm install` (installs dependencies)
2. Runs `npm run vercel-build` which:
   - Installs dependencies again (ensures latest)
   - Runs `npx prisma generate` (generates Prisma client)
3. Builds serverless function from `api/index.js`

## API Endpoints

All endpoints are available at `/api/*`:

- `GET /api/health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/referrals` - Get user referrals
- `GET /api/referral/:code` - Get referral link
- `POST /api/purchase` - Record purchase
- `GET /api/commission` - Get commissions
- `GET /api/admin/*` - Admin endpoints

## Testing

After deployment, test the health endpoint:
```bash
curl https://your-backend.vercel.app/api/health
```

Should return:
```json
{"status":"ok"}
```

## Troubleshooting

### Function Crashes
- Check Vercel function logs for specific errors
- Verify all environment variables are set
- Ensure Prisma client is generated (check build logs)

### CORS Errors
- Set `FRONTEND_URL` to your frontend domain
- Verify frontend sends requests to correct backend URL

### Database Connection
- Verify `DATABASE_URL` is correct
- Check Supabase connection settings
- Ensure database allows Vercel IPs

