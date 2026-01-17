import prisma from '../db/prisma.js';

/**
 * Commission rates by layer
 * Layer 1 → 12%
 * Layer 2 → 8%
 * Layer 3 → 4%
 */
const COMMISSION_RATES = {
  1: 0.12, // 12%
  2: 0.08, // 8%
  3: 0.04, // 4%
};

/**
 * Tier-based depth limits
 * Gold tier → max 3 layers
 * (Can be extended for other tiers)
 */
const TIER_DEPTH_LIMITS = {
  gold: 3,
  silver: 2,
  bronze: 1,
  default: 1,
};

/**
 * Get user tier from database
 * @param {string} userId - User ID
 * @returns {Promise<string>} - User tier (gold, silver, bronze, default)
 */
async function getUserTier(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });
    return user?.tier || 'gold';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'gold'; // Default to gold
  }
}

/**
 * Get max depth for a user based on their tier
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Maximum depth allowed
 */
async function getMaxDepth(userId) {
  const tier = await getUserTier(userId);
  return TIER_DEPTH_LIMITS[tier] || TIER_DEPTH_LIMITS.default;
}

/**
 * Traverse referral tree upward to find all referrers
 * @param {string} referredUserId - The user who made the purchase
 * @param {number} maxDepth - Maximum depth to traverse
 * @returns {Promise<Array>} - Array of { userId, layer, referralId } objects
 */
async function traverseReferralTree(referredUserId, maxDepth) {
  const referralChain = [];
  let currentUserId = referredUserId;
  let layer = 1;

  while (layer <= maxDepth) {
    // Find the referral where this user was referred
    const referral = await prisma.referral.findFirst({
      where: {
        referredId: currentUserId,
        status: 'verified', // Only count verified referrals
      },
      orderBy: {
        createdAt: 'desc', // Get most recent referral
      },
    });

    if (!referral) {
      // No more referrers in the chain
      break;
    }

    // Add to chain
    referralChain.push({
      userId: referral.referrerId,
      layer,
      referralId: referral.id,
      referral,
    });

    // Move up the chain
    currentUserId = referral.referrerId;
    layer++;
  }

  return referralChain;
}

/**
 * Calculate and store commissions for a purchase
 * @param {string} referredUserId - User who made the purchase
 * @param {number} purchaseAmount - Amount of the purchase
 * @param {string} purchaseId - Optional purchase ID for tracking
 * @returns {Promise<Object>} - Result with commissions created
 */
export async function calculateCommissions(referredUserId, purchaseAmount, purchaseId = null) {
  try {
    // Check if referred user has completed registration (has verified referral)
    const userReferral = await prisma.referral.findFirst({
      where: {
        referredId: referredUserId,
        status: 'verified',
      },
    });

    if (!userReferral) {
      return {
        success: false,
        error: 'User has not completed registration via referral',
        commissions: [],
      };
    }

    // Get the referrer's tier to determine max depth
    const referrerId = userReferral.referrerId;
    const maxDepth = await getMaxDepth(referrerId);

    // Traverse referral tree upward
    const referralChain = await traverseReferralTree(referredUserId, maxDepth);

    if (referralChain.length === 0) {
      return {
        success: false,
        error: 'No referral chain found',
        commissions: [],
      };
    }

    // Calculate and store commissions for each layer
    const commissions = [];
    
    for (const chainItem of referralChain) {
      const { userId, layer, referralId } = chainItem;

      // Get commission rate for this layer
      const commissionRate = COMMISSION_RATES[layer];
      if (!commissionRate) {
        console.warn(`No commission rate defined for layer ${layer}`);
        continue;
      }

      // Calculate commission amount
      const commissionAmount = purchaseAmount * commissionRate;

      // Store in commission ledger
      const commission = await prisma.commissionLedger.create({
        data: {
          userId,
          referralId,
          layer,
          amount: commissionAmount,
          purchaseAmount,
          commissionRate,
        },
      });

      commissions.push(commission);

      console.log(
        `[COMMISSION] Layer ${layer}: User ${userId} earned $${commissionAmount.toFixed(2)} ` +
        `(${(commissionRate * 100).toFixed(0)}%) from purchase of $${purchaseAmount.toFixed(2)}`
      );
    }

    return {
      success: true,
      commissions,
      totalCommissions: commissions.reduce((sum, c) => sum + c.amount, 0),
      referralChain: referralChain.map(c => ({
        userId: c.userId,
        layer: c.layer,
      })),
    };
  } catch (error) {
    console.error('Error calculating commissions:', error);
    return {
      success: false,
      error: error.message,
      commissions: [],
    };
  }
}

/**
 * Get commission ledger for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, offset, etc.)
 * @returns {Promise<Array>} - Commission records
 */
export async function getUserCommissions(userId, options = {}) {
  const { limit = 50, offset = 0, startDate, endDate } = options;

  const where = {
    userId,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const commissions = await prisma.commissionLedger.findMany({
    where,
    include: {
      referral: {
        select: {
          referralCode: true,
          referredId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });

  return commissions;
}

/**
 * Get commission statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Commission statistics
 */
export async function getCommissionStats(userId) {
  const total = await prisma.commissionLedger.aggregate({
    where: { userId },
    _sum: { amount: true },
    _count: { id: true },
  });

  const byLayer = await prisma.commissionLedger.groupBy({
    by: ['layer'],
    where: { userId },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    totalEarned: total._sum.amount || 0,
    totalCommissions: total._count.id || 0,
    byLayer: byLayer.map(l => ({
      layer: l.layer,
      amount: l._sum.amount || 0,
      count: l._count.id || 0,
      rate: `${(COMMISSION_RATES[l.layer] * 100).toFixed(0)}%`,
    })),
  };
}

/**
 * Check if user has completed registration (has verified referral)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user has completed registration
 */
export async function hasCompletedRegistration(userId) {
  const referral = await prisma.referral.findFirst({
    where: {
      referredId: userId,
      status: 'verified',
    },
  });

  return !!referral;
}

