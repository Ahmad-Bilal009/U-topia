import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Prisma will use DATABASE_URL from .env (should be your Supabase PostgreSQL connection string)
// For Supabase, use the direct connection string (not the pooled connection) for Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool configuration for Supabase
// Supabase has connection limits, so we handle disconnections gracefully
// Note: In Prisma 5.0.0+, $on('beforeExit') is not supported
// Graceful shutdown is handled in server.js using process events

export default prisma;

