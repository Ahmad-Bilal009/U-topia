import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import referralRoutes from './routes/referrals.js';
import referralLinkRoutes from './routes/referral.js';
import referralTrackingRoutes from './routes/referralTracking.js';
import commissionRoutes from './routes/commission.js';
import purchaseRoutes from './routes/purchase.js';
import adminRoutes from './routes/admin.js';
import { authenticate, optionalAuth } from './middleware/auth.js';
import prisma from './db/prisma.js';
import supabase from './db/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Verify environment variables
if (!process.env.DATABASE_URL) {
  console.warn('Warning: DATABASE_URL not found in environment variables');
}
if (supabase) {
  console.log('✓ Supabase client initialized');
} else {
  console.warn('Warning: Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env');
}

// Middleware
// CORS configuration - allow requests from frontend URL or Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL,
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
    ].filter(Boolean);
    
    // Check if origin matches any allowed origin
    if (allowedOrigins.some(allowed => {
      try {
        const url = new URL(origin);
        const allowedUrl = new URL(allowed);
        return url.hostname === allowedUrl.hostname || 
               origin.includes(allowedUrl.hostname) ||
               allowed.includes(url.hostname);
      } catch {
        return origin.includes(allowed) || allowed.includes(origin);
      }
    })) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow all origins
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/referrals', optionalAuth, referralRoutes);
app.use('/api/referral', optionalAuth, referralLinkRoutes);
app.use('/api/referral', optionalAuth, referralTrackingRoutes);
app.use('/api/commission', optionalAuth, commissionRoutes);
app.use('/api/purchase', purchaseRoutes);

// Admin/Director routes (require director role)
app.use('/api/admin', adminRoutes);

// Health check - handle both /health and /api/health for Vercel compatibility
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Export app for Vercel serverless functions
export default app;

// Only start server if not running as a serverless function
// Vercel sets VERCEL=1 or VERCEL_ENV environment variable
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  // Start server
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('✓ Database connected (Supabase PostgreSQL)');
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
    }
  });

  // Graceful shutdown handlers
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    try {
      await prisma.$disconnect();
      console.log('✓ Database disconnected');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await prisma.$disconnect();
    process.exit(1);
  });
}

