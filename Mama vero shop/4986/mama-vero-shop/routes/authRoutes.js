const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authController.updateMe);

// Continue with Google
// Note: session is used ONLY transiently to carry OAuth state during the
// redirect handshake below. The app itself remains JWT/cookie based - once
// googleCallback runs, we issue our own JWT and the express-session is no
// longer needed for subsequent requests.
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: true, failureRedirect: '/login.html?error=google' }),
  authController.googleCallback
);

module.exports = router;
