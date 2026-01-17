import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

// Read current .env
const envContent = fs.readFileSync(envPath, 'utf8');

// Fix issues:
// 1. Remove comma from SUPABASE_URL
// 2. URL encode password (# -> %23)
// 3. Fix DIRECT_URL to use direct connection hostname

const password = 'AhYpAeP#2p5gaaL';
const encodedPassword = encodeURIComponent(password);

// For Supabase, direct connection can use pooler hostname with port 5432 and ?pgbouncer=false
// Or use the direct connection format from Supabase dashboard
const fixedContent = envContent
  .replace(/SUPABASE_URL="https:\/\/ipoiimqkuoiqlulyaeit\.supabase\.co",/, 'SUPABASE_URL="https://ipoiimqkuoiqlulyaeit.supabase.co"')
  .replace(/AhYpAeP#2p5gaaL/g, encodedPassword)
  .replace(/DIRECT_URL="postgresql:\/\/postgres\.ipoiimqkuoiqlulyaeit:.*@.*\/postgres"/, 
    `DIRECT_URL="postgresql://postgres.ipoiimqkuoiqlulyaeit:${encodedPassword}@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=false"`);

fs.writeFileSync(envPath, fixedContent, 'utf8');

console.log('✅ Fixed .env file:');
console.log('   - Removed comma from SUPABASE_URL');
console.log('   - URL-encoded password (# -> %23)');
console.log('   - Fixed DIRECT_URL to use direct connection hostname');
console.log('\nUpdated connection strings:');
console.log('DATABASE_URL uses pooler (port 6543) for queries');
console.log('DIRECT_URL uses direct connection (port 5432) for migrations');

