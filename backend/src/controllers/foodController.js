const foodService = require('../services/foodService');
const logger = require('../utils/logger');

const getFoodLogs = async (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Query parameter "date" is required.',
    });
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Invalid date format. Please use YYYY-MM-DD.',
    });
  }

  try {
    const logs = await foodService.getFoodLogs(req.user.id, date);
    res.status(200).json({
      status: 'success',
      data: logs,
    });
  } catch (error) {
    logger.error(`Get food logs error for user ${req.user.id} on date ${date}`, error);
    next(error);
  }
};

const addFoodLog = async (req, res, next) => {
  const { meal_type, food_name, quantity_grams, calories } = req.body;
  const errors = [];

  // Basic validation rules
  if (!meal_type || !['breakfast', 'lunch', 'dinner', 'snacks', 'snack'].includes(meal_type.toLowerCase())) {
    errors.push({ field: 'meal_type', message: 'Meal type must be breakfast, lunch, dinner, or snacks' });
  }

  if (!food_name || !food_name.trim()) {
    errors.push({ field: 'food_name', message: 'Food name is required' });
  }

  if (quantity_grams !== undefined) {
    const qty = parseFloat(quantity_grams);
    if (isNaN(qty) || qty <= 0 || qty > 5000) {
      errors.push({ field: 'quantity_grams', message: 'Quantity must be a positive number up to 5000g' });
    }
  }

  if (calories !== undefined) {
    const cal = parseFloat(calories);
    if (isNaN(cal) || cal < 0 || cal > 10000) {
      errors.push({ field: 'calories', message: 'Calories must be a number between 0 and 10000' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Food log validation failed',
      errors,
    });
  }

  try {
    // Standardize 'snack' category name to match frontend timeline grouping
    if (req.body.meal_type.toLowerCase() === 'snack') {
      req.body.meal_type = 'snacks';
    }
    const newLog = await foodService.addFoodLog(req.user.id, req.body);
    
    logger.info(`Logged food item: "${newLog.food_name}" for user ${req.user.id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Food entry logged successfully',
      data: newLog,
    });
  } catch (error) {
    logger.error(`Add food log error for user ${req.user.id}`, error);
    next(error);
  }
};

const updateFoodLog = async (req, res, next) => {
  const logId = req.params.id;

  try {
    const updated = await foodService.updateFoodLog(req.user.id, logId, req.body);
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Food entry not found or unauthorized to update.',
      });
    }

    logger.info(`Updated food log: ${logId} for user ${req.user.id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Food entry updated successfully',
      data: updated,
    });
  } catch (error) {
    logger.error(`Update food log error for logId ${logId} and user ${req.user.id}`, error);
    next(error);
  }
};

const deleteFoodLog = async (req, res, next) => {
  const logId = req.params.id;

  try {
    const deleted = await foodService.deleteFoodLog(req.user.id, logId);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Food entry not found or unauthorized to delete.',
      });
    }

    logger.info(`Deleted food log: ${logId} for user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Food entry deleted successfully',
      data: deleted,
    });
  } catch (error) {
    logger.error(`Delete food log error for logId ${logId} and user ${req.user.id}`, error);
    next(error);
  }
};

module.exports = {
  getFoodLogs,
  addFoodLog,
  updateFoodLog,
  deleteFoodLog,
};
