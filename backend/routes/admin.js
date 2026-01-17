import express from 'express';
import prisma from '../db/prisma.js';
import { requireDirector } from '../middleware/authorize.js';

const router = express.Router();

/**
 * GET /api/admin/users
 * Get all users with their stats (Director only)
 */
router.get('/users', requireDirector, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            referralsAsReferrer: true,
            referralsAsReferred: true,
            commissions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get commission stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const commissionStats = await prisma.commissionLedger.aggregate({
          where: { userId: user.id },
          _sum: { amount: true },
          _count: { id: true },
        });

        const verifiedReferrals = await prisma.referral.count({
          where: {
            referrerId: user.id,
            status: 'verified',
          },
        });

        return {
          ...user,
          stats: {
            totalEarnings: commissionStats._sum.amount || 0,
            totalCommissions: commissionStats._count.id || 0,
            totalReferrals: user._count.referralsAsReferrer,
            verifiedReferrals,
            referredBy: user._count.referralsAsReferred > 0,
          },
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats,
      count: usersWithStats.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/commissions
 * Get all commissions across all users (Director only)
 */
router.get('/commissions', requireDirector, async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, userId, startDate, endDate } = req.query;

    const where = {};
    
    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const commissions = await prisma.commissionLedger.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
          },
        },
        referral: {
          select: {
            referralCode: true,
            referrerId: true,
            referredId: true,
            status: true,
          },
          include: {
            referrer: {
              select: {
                email: true,
                name: true,
              },
            },
            referred: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.commissionLedger.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    res.json({
      success: true,
      data: commissions,
      count: commissions.length,
      total: {
        totalAmount: total._sum.amount || 0,
        totalCount: total._count.id || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/stats
 * Get overall statistics (Director only)
 */
router.get('/stats', requireDirector, async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalReferrals,
      verifiedReferrals,
      totalCommissions,
      totalEarnings,
      usersByTier,
      commissionsByLayer,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: 'verified' } }),
      prisma.commissionLedger.count(),
      prisma.commissionLedger.aggregate({
        _sum: { amount: true },
      }),
      prisma.user.groupBy({
        by: ['tier'],
        _count: { id: true },
      }),
      prisma.commissionLedger.groupBy({
        by: ['layer'],
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Top earners
    const topEarners = await prisma.commissionLedger.groupBy({
      by: ['userId'],
      _sum: { amount: true },
      _count: { id: true },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10,
    });

    const topEarnersWithDetails = await Promise.all(
      topEarners.map(async (earner) => {
        const user = await prisma.user.findUnique({
          where: { id: earner.userId },
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
          },
        });
        return {
          user,
          totalEarnings: earner._sum.amount || 0,
          commissionCount: earner._count.id || 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalReferrals,
          verifiedReferrals,
          totalCommissions,
          totalEarnings: totalEarnings._sum.amount || 0,
        },
        usersByTier: usersByTier.map((t) => ({
          tier: t.tier,
          count: t._count.id,
        })),
        commissionsByLayer: commissionsByLayer.map((l) => ({
          layer: l.layer,
          totalAmount: l._sum.amount || 0,
          count: l._count.id || 0,
        })),
        topEarners: topEarnersWithDetails,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/user/:userId
 * Get detailed stats for a specific user (Director only)
 */
router.get('/user/:userId', requireDirector, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referralsAsReferrer: {
          include: {
            referred: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        commissions: {
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
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Calculate stats
    const commissionStats = await prisma.commissionLedger.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: { id: true },
    });

    const commissionsByLayer = await prisma.commissionLedger.groupBy({
      by: ['layer'],
      where: { userId },
      _sum: { amount: true },
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
          role: user.role,
          createdAt: user.createdAt,
        },
        stats: {
          totalEarnings: commissionStats._sum.amount || 0,
          totalCommissions: commissionStats._count.id || 0,
          totalReferrals: user.referralsAsReferrer.length,
          verifiedReferrals: user.referralsAsReferrer.filter((r) => r.status === 'verified').length,
          commissionsByLayer: commissionsByLayer.map((l) => ({
            layer: l.layer,
            amount: l._sum.amount || 0,
            count: l._count.id || 0,
          })),
        },
        referrals: user.referralsAsReferrer,
        commissions: user.commissions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

