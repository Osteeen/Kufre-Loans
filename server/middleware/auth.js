const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * JWT authentication middleware.
 * Extracts the Bearer token from the Authorization header, verifies it,
 * fetches the user from the database, and attaches them to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token has expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
    }

    const result = await query(
      `SELECT id, tenant_id, first_name, last_name, email, phone, role,
              account_number, bank_name, tier, is_verified, created_at
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'User not found. Token may be stale.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Authentication service error.' });
  }
}

module.exports = authenticate;
