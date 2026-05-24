const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { validateProfileUpdate } = require('../middleware/validator');

const router = express.Router();

router.use(apiLimiter);
router.use(authenticateToken);

router.get('/', profileController.getProfile);
router.put('/', validateProfileUpdate, profileController.updateProfile);

module.exports = router;
