import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db/prisma.js';
import { generateUniqueReferralCode, markReferralAsUsed } from '../services/referralLinkService.js';
import { authenticate } from '../middleware/auth.js';

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

// Use authenticate middleware instead of requireAuth
const requireAuth = authenticate;

/**
 * POST /api/referral/generate
 * Generate a unique one-time use referral link
 * Requires: Valid user session
 * Returns: { referralLink: "https://site.com/referral/ABC123" }
 */
router.post(
  '/generate',
  requireAuth,
  // No validation needed for baseUrl - it's optional and we handle it in the route
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      // Accept baseUrl from body, or use environment variable, or default
      let baseUrl = req.body.baseUrl || process.env.FRONTEND_URL || 'https://site.com';
      
      // Ensure baseUrl is a string and handle any URL format
      if (typeof baseUrl !== 'string') {
        baseUrl = 'https://site.com';
      }
      
      console.log(`[REFERRAL GENERATE] User: ${userId}, BaseUrl: ${baseUrl}`);

      // Check if user already has an active referral link
      const existingActiveLink = await prisma.referral.findFirst({
        where: {
          referrerId: userId,
          status: 'active',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // If user has an active link, return it instead of creating a new one
      if (existingActiveLink) {
        const referralLink = `${baseUrl}/referral/${existingActiveLink.referralCode}`;
        return res.json({
          success: true,
          referralLink,
        });
      }

      // Generate unique referral code
      const referralCode = await generateUniqueReferralCode(userId);

      // Create referral link record
      const referral = await prisma.referral.create({
        data: {
          referrerId: userId,
          referralCode,
          status: 'active', // One-time use link starts as active
        },
      });

      // Construct full referral link
      const referralLink = `${baseUrl}/referral/${referralCode}`;

      res.status(201).json({
        success: true,
        referralLink,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/referral/use/:code
 * Mark a referral link as used (called after successful signup)
 * This endpoint should be called when a user signs up using a referral link
 */
router.post(
  '/use/:code',
  requireAuth,
  async (req, res, next) => {
    try {
      const { code } = req.params;
      const referredUserId = req.user.id; // The user who signed up using the referral

      const result = await markReferralAsUsed(code, referredUserId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        message: 'Referral link marked as used',
        data: result.referral,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/referral/validate/:code
 * Validate if a referral code is active and can be used
 * Returns: { valid: true/false, message: "..." }
 */
router.get(
  '/validate/:code',
  async (req, res, next) => {
    try {
      const { code } = req.params;

      const referral = await prisma.referral.findUnique({
        where: { referralCode: code },
      });

      if (!referral) {
        return res.json({
          success: true,
          valid: false,
          message: 'Referral code not found',
        });
      }

      if (referral.status === 'used') {
        return res.json({
          success: true,
          valid: false,
          message: 'This referral link has already been used',
        });
      }

      if (referral.status !== 'active') {
        return res.json({
          success: true,
          valid: false,
          message: 'This referral link is not active',
        });
      }

      res.json({
        success: true,
        valid: true,
        message: 'Referral code is valid and can be used',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

