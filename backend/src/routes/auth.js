const express = require('express');
const {
  register,
  login,
  logout
} = require('../controllers/auth');
const {
  getProfile,
  updateProfile
} = require('../controllers/profile');
const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateProfileUpdate
} = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes (Rate Limited)
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Logout requires authentication so req.user is available to increment token_version.
// Unauthenticated callers simply get a 401 from protect; no version bump is needed.
router.post('/logout', protect, logout);

// Protected routes (Require valid token header)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validateProfileUpdate, updateProfile);

module.exports = router;
