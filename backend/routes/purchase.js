import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { calculateCommissions } from '../services/commissionService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/purchase
 * Record a purchase and calculate commissions
 * This endpoint simulates a purchase and triggers commission calculation
 */
router.post(
  '/',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('description').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { amount, description } = req.body;

      // Check if user has completed registration (has verified referral)
      const userReferral = await prisma.referral.findFirst({
        where: {
          referredId: userId,
          status: 'verified',
        },
      });

      if (!userReferral) {
        return res.status(400).json({
          success: false,
          error: 'User must have completed registration via referral to make purchases',
        });
      }

      // Calculate commissions for this purchase
      const commissionResult = await calculateCommissions(userId, amount, `purchase-${Date.now()}`);

      if (!commissionResult.success) {
        return res.status(400).json({
          success: false,
          error: commissionResult.error || 'Failed to calculate commissions',
        });
      }

      // In a real system, you would also store the purchase record here
      // For now, we just return the commission calculation result

      res.json({
        success: true,
        message: 'Purchase recorded and commissions calculated',
        data: {
          purchase: {
            userId,
            amount,
            description: description || 'Purchase',
            timestamp: new Date(),
          },
          commissions: {
            totalCommissions: commissionResult.totalCommissions,
            commissionCount: commissionResult.commissions.length,
            referralChain: commissionResult.referralChain,
            commissions: commissionResult.commissions,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

