import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { generateReferralCode, getReferralStats } from '../services/referralService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/referrals - Get all referrals for the current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
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
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/referrals/stats - Get referral statistics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await getReferralStats(userId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/referrals - Create a new referral code
router.post(
  '/',
  [
    body('referralCode').optional().isString().trim().isLength({ min: 3, max: 50 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { referralCode } = req.body;

      // Check if user already has a referral code
      const existingReferral = await prisma.referral.findFirst({
        where: {
          referrerId: userId,
        },
      });

      if (existingReferral) {
        return res.json({
          success: true,
          data: existingReferral,
          message: 'Referral code already exists',
        });
      }

      // Generate or use provided referral code
      const code = referralCode || generateReferralCode(userId);

      // Check if code already exists
      const codeExists = await prisma.referral.findUnique({
        where: { referralCode: code },
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          error: 'Referral code already exists',
        });
      }

      const referral = await prisma.referral.create({
        data: {
          referrerId: userId,
          referralCode: code,
          status: 'pending',
        },
      });

      res.status(201).json({
        success: true,
        data: referral,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/referrals/:code - Get referral by code
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    const referral = await prisma.referral.findUnique({
      where: { referralCode: code },
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'Referral code not found',
      });
    }

    res.json({
      success: true,
      data: referral,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

