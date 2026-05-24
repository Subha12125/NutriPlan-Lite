const express = require('express');
const foodController = require('../controllers/foodController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(apiLimiter);
router.use(authenticateToken);

router.get('/', foodController.getFoodLogs);
router.post('/', foodController.addFoodLog);
router.put('/:id', foodController.updateFoodLog);
router.delete('/:id', foodController.deleteFoodLog);

module.exports = router;
