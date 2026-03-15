/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.post('/some-route', authenticate, requireRole('super_admin', 'approver'), handler);
 *
 * @param {...string} roles - One or more allowed roles.
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = { requireRole };
