import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateWithUsers() {
  try {
    console.log('Starting migration with user creation...');

    // Get all unique referrer IDs from existing referrals
    const referrals = await prisma.referral.findMany({
      select: {
        referrerId: true,
        referredId: true,
      },
      distinct: ['referrerId'],
    });

    const allUserIds = new Set();
    referrals.forEach(r => {
      if (r.referrerId) allUserIds.add(r.referrerId);
      if (r.referredId) allUserIds.add(r.referredId);
    });

    console.log(`Found ${allUserIds.size} unique user IDs to create`);

    // Create placeholder users for existing referrals
    for (const userId of allUserIds) {
      try {
        // Check if user already exists
        const existing = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!existing) {
          // Create placeholder user
          const hashedPassword = await bcrypt.hash('temp-password-' + userId, 10);
          await prisma.user.create({
            data: {
              id: userId,
              email: `user-${userId}@placeholder.com`,
              password: hashedPassword,
              name: `User ${userId}`,
              tier: 'gold',
            },
          });
          console.log(`Created placeholder user: ${userId}`);
        }
      } catch (error) {
        if (error.code !== 'P2002') { // Ignore duplicate email errors
          console.error(`Error creating user ${userId}:`, error.message);
        }
      }
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateWithUsers();

