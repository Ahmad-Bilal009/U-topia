import prisma from '../db/prisma.js';
import { sendReferralNotification } from '../services/notificationService.js';

/**
 * Middleware to validate referral link and attach referrer_id to session
 * This should be called when a user clicks on a referral link
 * 
 * Usage: app.get('/signup/:referralCode?', validateReferralLink, ...)
 */
export const validateReferralLink = async (req, res, next) => {
  try {
    const referralCode = req.params.referralCode || req.query.ref || req.body.referralCode;

    // If no referral code, continue without referral tracking
    if (!referralCode) {
      return next();
    }

    // Validate referral code
    const referral = await prisma.referral.findUnique({
      where: { referralCode },
    });

    if (!referral) {
      // Invalid referral code - mark as invalid but continue
      console.log(`[REFERRAL TRACKING] Invalid referral code: ${referralCode}`);
      req.referral = {
        valid: false,
        status: 'invalid',
        message: 'Referral code not found',
      };
      return next();
    }

    // Check if referral is already used
    if (referral.status === 'used' || referral.status === 'verified') {
      console.log(`[REFERRAL TRACKING] Referral code already used: ${referralCode}`);
      req.referral = {
        valid: false,
        status: 'invalid',
        message: 'This referral link has already been used',
        referral,
      };
      return next();
    }

    // Check if referral is active
    if (referral.status !== 'active') {
      console.log(`[REFERRAL TRACKING] Referral code not active: ${referralCode}, status: ${referral.status}`);
      req.referral = {
        valid: false,
        status: 'invalid',
        message: 'This referral link is not active',
        referral,
      };
      return next();
    }

    // Valid referral - attach to session/request
    req.referral = {
      valid: true,
      status: 'active',
      referrerId: referral.referrerId,
      referralCode: referral.referralCode,
      referralId: referral.id,
      referral,
    };

    // Store in session if available (for tracking before signup)
    // Also store in request for immediate use
    if (req.session) {
      req.session.referralCode = referralCode;
      req.session.referrerId = referral.referrerId;
    }
    
    // Store in request object for immediate access (works without sessions)
    req.referralCode = referralCode;
    req.referrerId = referral.referrerId;

    // Log referral link click
    console.log(`[REFERRAL TRACKING] Valid referral link clicked: ${referralCode} by referrer: ${referral.referrerId}`);

    next();
  } catch (error) {
    console.error('[REFERRAL TRACKING] Error validating referral link:', error);
    // Continue without referral tracking on error
    req.referral = {
      valid: false,
      status: 'invalid',
      message: 'Error validating referral code',
    };
    next();
  }
};

/**
 * Middleware to get referral from session (for signup flow)
 * This retrieves the referral code that was stored in session
 */
export const getReferralFromSession = (req, res, next) => {
  try {
    // Check session first
    if (req.session && req.session.referralCode) {
      req.referralCode = req.session.referralCode;
      req.referrerId = req.session.referrerId;
      return next();
    }

    // Check query params as fallback
    if (req.query.ref) {
      req.referralCode = req.query.ref;
      return next();
    }

    // Check body as fallback
    if (req.body.referralCode) {
      req.referralCode = req.body.referralCode;
      return next();
    }

    next();
  } catch (error) {
    console.error('[REFERRAL TRACKING] Error getting referral from session:', error);
    next();
  }
};

