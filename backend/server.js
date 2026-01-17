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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

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

