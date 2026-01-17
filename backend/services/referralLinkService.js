import prisma from '../db/prisma.js';
import crypto from 'crypto';

/**
 * Generate a unique referral code
 * Format: Random alphanumeric string (8-12 characters)
 * @returns {string} - Unique referral code
 */
function generateReferralCode() {
  // Generate a random alphanumeric code (8-12 characters)
  const length = 10;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Generate a unique referral code that doesn't exist in database
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Unique referral code
 */
export async function generateUniqueReferralCode(userId) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateReferralCode();

    // Check if code already exists
    const existing = await prisma.referral.findUnique({
      where: { referralCode: code },
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  // If we couldn't generate a unique code after max attempts,
  // use a more complex approach with timestamp
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  const userPart = userId.slice(-4).toUpperCase();
  return `${timestamp}-${userPart}-${randomPart}`;
}

/**
 * Mark a referral link as used after successful signup
 * @param {string} referralCode - The referral code that was used
 * @param {string} referredUserId - ID of the user who signed up using the referral
 * @returns {Promise<Object>} - Result object with success status
 */
export async function markReferralAsUsed(referralCode, referredUserId) {
  try {
    // Find the referral
    const referral = await prisma.referral.findUnique({
      where: { referralCode },
    });

    if (!referral) {
      return {
        success: false,
        statusCode: 404,
        error: 'Referral code not found',
      };
    }

    // Check if already used
    if (referral.status === 'used') {
      return {
        success: false,
        statusCode: 400,
        error: 'This referral link has already been used',
      };
    }

    // Check if not active
    if (referral.status !== 'active') {
      return {
        success: false,
        statusCode: 400,
        error: 'This referral link is not active',
      };
    }

    // Prevent self-referral
    if (referral.referrerId === referredUserId) {
      return {
        success: false,
        statusCode: 400,
        error: 'Cannot use your own referral link',
      };
    }

    // Update referral to used status
    const updatedReferral = await prisma.referral.update({
      where: { referralCode },
      data: {
        status: 'used',
        referredId: referredUserId,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      referral: updatedReferral,
    };
  } catch (error) {
    console.error('Error marking referral as used:', error);
    return {
      success: false,
      statusCode: 500,
      error: 'Failed to mark referral as used',
    };
  }
}

/**
 * Get active referral link for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Active referral or null
 */
export async function getActiveReferralLink(userId) {
  return await prisma.referral.findFirst({
    where: {
      referrerId: userId,
      status: 'active',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

