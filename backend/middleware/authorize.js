import { authenticate } from './auth.js';

/**
 * Role-based authorization middleware
 * @param {...string} allowedRoles - Roles that are allowed to access
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // First authenticate
    authenticate(req, res, (err) => {
      if (err) {
        return next(err);
      }

      // Check if user has required role
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userRole = req.user.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.',
          requiredRoles: allowedRoles,
          userRole,
        });
      }

      next();
    });
  };
};

/**
 * Check if user is director or admin
 */
export const requireDirector = authorize('director', 'admin');

