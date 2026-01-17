import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import { sendReferralNotification } from '../services/notificationService.js';
import { generateUniqueReferralCode } from '../services/referralLinkService.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

/**
 * POST /api/auth/signup
 * User registration with optional referral code
 */
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().isString().trim(),
    body('referralCode').optional().isString().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, referralCode } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
          tier: 'gold', // Default tier
          role: 'user', // Default role
        },
        select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          role: true,
          createdAt: true,
        },
      });

      // Handle referral if provided
      let referralData = null;
      if (referralCode) {
        // Validate and mark referral as used
        const referral = await prisma.referral.findUnique({
          where: { referralCode },
        });

        if (referral && referral.status === 'active') {
          // Prevent self-referral
          if (referral.referrerId !== user.id) {
            // Mark referral as verified
            const updatedReferral = await prisma.referral.update({
              where: { referralCode },
              data: {
                status: 'verified',
                referredId: user.id,
                updatedAt: new Date(),
              },
            });

            // Send notification to referrer
            sendReferralNotification(referral.referrerId, user.id, referralCode);

            // Auto-generate new referral link for referrer
            try {
              const newCode = await generateUniqueReferralCode(referral.referrerId);
              await prisma.referral.create({
                data: {
                  referrerId: referral.referrerId,
                  referralCode: newCode,
                  status: 'active',
                },
              });
            } catch (error) {
              console.error('Error generating new referral link:', error);
            }

            referralData = {
              referralCode,
              referrerId: referral.referrerId,
              message: 'Referral link used successfully! You will be awarded when you make a purchase.',
            };
          }
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
          referral: referralData,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res, next) => {
  try {
    // Try to get user from token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.headers['x-user-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
          id: true,
          email: true,
          name: true,
          tier: true,
          role: true,
          createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

/**
 * GET /api/auth/validate-referral/:code
 * Validate referral code and return info (for toast message)
 */
router.get('/validate-referral/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    const referral = await prisma.referral.findUnique({
      where: { referralCode: code },
      include: {
        referrer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!referral) {
      return res.json({
        success: true,
        valid: false,
        message: 'Referral code not found',
      });
    }

    if (referral.status === 'used' || referral.status === 'verified') {
      return res.json({
        success: true,
        valid: false,
        message: 'This referral link has already been used',
        used: true,
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
      message: 'Referral link is valid! Sign up to get rewarded.',
      referral: {
        code: referral.referralCode,
        referrerName: referral.referrer?.name || 'User',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

