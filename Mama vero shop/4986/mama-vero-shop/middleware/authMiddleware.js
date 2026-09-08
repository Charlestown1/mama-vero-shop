const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT sent as an httpOnly cookie ("token") and attaches the
 * authenticated user to req.user. Rejects the request outright if missing
 * or invalid - never trusts anything the client claims about itself.
 */
async function protect(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
}

module.exports = { protect };
