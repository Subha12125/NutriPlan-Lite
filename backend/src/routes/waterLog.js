const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getWaterLogs,
  createWaterLog,
  resetWaterLogs,
  deleteWaterLog
} = require('../controllers/waterLog');
const { protect } = require('../middleware/auth');
const { validateWaterLog } = require('../middleware/validation');

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

// Secure all water log routes with JWT middleware
router.use(protect);

router.route('/')
  .get(getWaterLogs)
  .post(writeLimiter, validateWaterLog, createWaterLog);

router.delete('/reset', writeLimiter, resetWaterLogs);

router.delete('/:id', writeLimiter, deleteWaterLog);

module.exports = router;
