/**
 * Must run AFTER `protect`. Blocks any non-admin from hitting admin-only
 * API routes, regardless of what the frontend UI shows or hides.
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to perform this action.',
    });
  }
  next();
}

module.exports = { adminOnly };
