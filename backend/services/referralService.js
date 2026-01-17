import prisma from '../db/prisma.js';
import crypto from 'crypto';

/**
 * Generate a unique referral code
 * @param {string} userId - User ID to incorporate into code
 * @returns {string} - Unique referral code
 */
export function generateReferralCode(userId) {
  // Create a code based on user ID and random string
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  const userPart = userId.slice(-4).toUpperCase();
  return `${userPart}-${randomPart}`;
}

/**
 * Get referral statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Statistics object
 */
export async function getReferralStats(userId) {
  const totalReferrals = await prisma.referral.count({
    where: { referrerId: userId },
  });

  const completedReferrals = await prisma.referral.count({
    where: {
      referrerId: userId,
      status: { in: ['completed', 'verified'] },
    },
  });

  const pendingReferrals = await prisma.referral.count({
    where: {
      referrerId: userId,
      status: { in: ['pending', 'active'] },
    },
  });

  const totalRewards = await prisma.referral.aggregate({
    where: {
      referrerId: userId,
      status: { in: ['completed', 'rewarded'] },
    },
    _sum: {
      rewardAmount: true,
    },
  });

  // Get the user's active referral code (prefer active status)
  const userReferral = await prisma.referral.findFirst({
    where: { 
      referrerId: userId,
      status: 'active',
    },
    select: { referralCode: true },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // If no active referral, get any referral
  const anyReferral = userReferral || await prisma.referral.findFirst({
    where: { referrerId: userId },
    select: { referralCode: true },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    totalRewards: totalRewards._sum.rewardAmount || 0,
    referralCode: anyReferral?.referralCode || null,
  };
}

