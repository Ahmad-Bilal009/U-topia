import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to Supabase database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✓ Connected to Supabase database');

    // Check if Referral table exists by trying to count
    try {
      const count = await prisma.referral.count();
      console.log(`✓ Referral table exists (${count} records)`);
    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('⚠ Referral table does not exist. Run migrations first:');
        console.log('   npm run prisma:migrate');
        process.exit(1);
      } else {
        throw error;
      }
    }

    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'P1001') {
      console.error('\n💡 Make sure:');
      console.error('   1. DATABASE_URL is set correctly in .env');
      console.error('   2. Your Supabase database is running');
      console.error('   3. The connection string format is: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

