const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getFoodLogs,
  createFoodLog,
  updateFoodLog,
  deleteFoodLog
} = require('../controllers/foodLog');
const { protect } = require('../middleware/auth');
const { validateFoodLog } = require('../middleware/validation');

const router = express.Router();

// 60 write operations per user per 15 minutes on mutating endpoints
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Secure all food log routes with JWT middleware
router.use(protect);

router.route('/')
  .get(getFoodLogs)
  .post(writeLimiter, validateFoodLog, createFoodLog);

router.route('/:id')
  .put(writeLimiter, validateFoodLog, updateFoodLog)
  .delete(writeLimiter, deleteFoodLog);

module.exports = router;
