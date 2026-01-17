import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import {
  calculateCommissions,
  getUserCommissions,
  getCommissionStats,
  hasCompletedRegistration,
} from '../services/commissionService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
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

// Use authenticate middleware
const requireAuth = authenticate;

/**
 * POST /api/commission/calculate
 * Calculate and store commissions for a purchase
 * 
 * Body: { referredUserId, purchaseAmount, purchaseId? }
 */
router.post(
  '/calculate',
  requireAuth,
  [
    body('referredUserId')
      .notEmpty()
      .withMessage('referredUserId is required'),
    body('purchaseAmount')
      .isFloat({ min: 0.01 })
      .withMessage('purchaseAmount must be a positive number'),
    body('purchaseId').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { referredUserId, purchaseAmount, purchaseId } = req.body;

      // Verify that referred user has completed registration
      const hasRegistration = await hasCompletedRegistration(referredUserId);
      if (!hasRegistration) {
        return res.status(400).json({
          success: false,
          error: 'Commission can only be calculated if referred user has completed registration',
        });
      }

      // Calculate commissions
      const result = await calculateCommissions(referredUserId, purchaseAmount, purchaseId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Commissions calculated and stored',
        data: {
          totalCommissions: result.totalCommissions,
          commissionCount: result.commissions.length,
          referralChain: result.referralChain,
          commissions: result.commissions,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/commission/user/:userId
 * Get commission ledger for a user
 * 
 * Query params: limit, offset, startDate, endDate
 */
router.get(
  '/user/:userId',
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { limit, offset, startDate, endDate } = req.query;

      const commissions = await getUserCommissions(userId, {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: commissions,
        count: commissions.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/commission/stats/:userId
 * Get commission statistics for a user
 */
router.get(
  '/stats/:userId',
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      const stats = await getCommissionStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/commission/my-commissions
 * Get current user's commissions (requires auth)
 */
router.get(
  '/my-commissions',
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { limit, offset, startDate, endDate } = req.query;

      const commissions = await getUserCommissions(userId, {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: commissions,
        count: commissions.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/commission/my-stats
 * Get current user's commission statistics (requires auth)
 */
router.get(
  '/my-stats',
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      const stats = await getCommissionStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

