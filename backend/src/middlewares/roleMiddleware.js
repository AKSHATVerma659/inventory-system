/**
 * Role-based authorization middleware
 * Safe, defensive, ERP-grade
 */

module.exports = (allowedRoles = []) => {
  // Normalize allowedRoles to array
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    // 1️⃣ Auth check
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized: User not authenticated'
      });
    }

    // 2️⃣ Normalize user roles
    let userRoles = [];

    if (Array.isArray(req.user.roles)) {
      userRoles = req.user.roles;
    } else if (typeof req.user.role === 'string') {
      userRoles = [req.user.role];
    }

    // 3️⃣ No roles on user
    if (!userRoles.length) {
      return res.status(403).json({
        error: 'Forbidden: No roles assigned'
      });
    }

    // 4️⃣ Role match check
    const hasAccess = allowedRoles.some(role =>
      userRoles.includes(role)
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden: Access denied'
      });
    }

    // 5️⃣ All good
    next();
  };
};
