import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { validateReferralLink, getReferralFromSession } from '../middleware/referralTracking.js';
import { 
  sendReferralNotification, 
  notifyReferralLinkClick,
  notifyInvalidReferral 
} from '../services/notificationService.js';
import { generateUniqueReferralCode } from '../services/referralLinkService.js';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  next();
};

/**
 * GET /api/referral/track/:code
 * Track referral link click
 * Validates referral code and attaches referrer_id to session
 * Called when user clicks on a referral link
 */
router.get(
  '/track/:code',
  validateReferralLink,
  async (req, res, next) => {
    try {
      const { code } = req.params;

      if (!req.referral || !req.referral.valid) {
        return res.json({
          success: false,
          valid: false,
          message: req.referral?.message || 'Invalid referral code',
        });
      }

      // Store referral in session for later use during signup
      if (req.session) {
        req.session.referralCode = code;
        req.session.referrerId = req.referral.referrerId;
      }

      // Send notification (placeholder - console.log)
      notifyReferralLinkClick(req.referral.referrerId, code);

      res.json({
        success: true,
        valid: true,
        message: 'Referral link is valid',
        referrerId: req.referral.referrerId,
        referralCode: code,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/referral/track/signup
 * Store referral record and mark as verified
 * Called after successful user signup
 * 
 * Body: { userId, referralCode? }
 */
router.post(
  '/track/signup',
  getReferralFromSession,
  [
    body('userId').notEmpty().withMessage('userId is required'),
    body('referralCode').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { userId } = req.body;
      const referralCode = req.body.referralCode || req.referralCode;

      // If no referral code, signup without referral
      if (!referralCode) {
        return res.json({
          success: true,
          message: 'Signup completed without referral',
          referral: null,
        });
      }

      // Find the referral
      const referral = await prisma.referral.findUnique({
        where: { referralCode },
      });

      if (!referral) {
        return res.status(400).json({
          success: false,
          error: 'Referral code not found',
        });
      }

      // Check if already verified
      if (referral.status === 'verified') {
        return res.json({
          success: true,
          message: 'Referral already verified',
          referral,
        });
      }

      // Prevent self-referral
      if (referral.referrerId === userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot use your own referral link',
        });
      }

      // Check if referral is active
      if (referral.status !== 'active') {
        // Mark as invalid if not active
        const updatedReferral = await prisma.referral.update({
          where: { referralCode },
          data: {
            status: 'invalid',
            referredId: userId,
            updatedAt: new Date(),
          },
        });

        notifyInvalidReferral(referral.referrerId, referralCode, 'Referral was not active during signup');

        return res.status(400).json({
          success: false,
          error: 'Referral link is not active',
          referral: updatedReferral,
        });
      }

      // Mark referral as verified and store referred user ID
      const updatedReferral = await prisma.referral.update({
        where: { referralCode },
        data: {
          status: 'verified',
          referredId: userId,
          updatedAt: new Date(),
        },
      });

      // Send notification to referrer
      sendReferralNotification(referral.referrerId, userId, referralCode);

      // Auto-generate new referral link for the referrer (link refresh after use)
      let newReferralLink = null;
      try {
        const newCode = await generateUniqueReferralCode(referral.referrerId);
        const newReferral = await prisma.referral.create({
          data: {
            referrerId: referral.referrerId,
            referralCode: newCode,
            status: 'active',
          },
        });
        const baseUrl = process.env.FRONTEND_URL || 'https://site.com';
        newReferralLink = `${baseUrl}/referral/${newCode}`;
        console.log(`[REFERRAL REFRESH] New referral link generated for user ${referral.referrerId}: ${newCode}`);
      } catch (error) {
        console.error('[REFERRAL REFRESH] Error generating new link:', error);
        // Don't fail the request if auto-generation fails
      }

      // Clear referral from session
      if (req.session) {
        delete req.session.referralCode;
        delete req.session.referrerId;
      }

      res.json({
        success: true,
        message: 'Referral verified and stored',
        referral: updatedReferral,
        newReferralLink, // Include new link if generated
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/referral/tracking/:userId
 * Get all referral tracking records for a user (as referrer)
 */
router.get(
  '/tracking/:userId',
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      const referrals = await prisma.referral.findMany({
        where: {
          referrerId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: referrals,
        count: referrals.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/referral/tracking/stats/:userId
 * Get referral tracking statistics for a user
 */
router.get(
  '/tracking/stats/:userId',
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      const total = await prisma.referral.count({
        where: { referrerId: userId },
      });

      const active = await prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'active',
        },
      });

      const verified = await prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'verified',
        },
      });

      const invalid = await prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'invalid',
        },
      });

      res.json({
        success: true,
        stats: {
          total,
          active,
          verified,
          invalid,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

