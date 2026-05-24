const express = require('express');
const waterController = require('../controllers/waterController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(apiLimiter);
router.use(authenticateToken);

router.get('/', waterController.getWaterLogs);
router.post('/', waterController.addWaterLog);
router.delete('/', waterController.resetWaterLogs);

module.exports = router;
