const foodLogService = require('../services/foodLog');
const logger = require('../config/logger');
const { AppError } = require('../middleware/error');

/**
 * Formats an unexpected service/DB error for the client without leaking internals.
 * Logs the full error server-side.
 */
function handleUnexpectedError(err, context, next) {
  logger.error(`[foodLog controller] ${context}: ${err.message || err}`, { stack: err.stack });
  // Operational errors (AppError) are forwarded as-is with their status code.
  // All other errors are masked with a generic 500 so internals are never exposed.
  if (err.isOperational) {
    return next(err);
  }
  return next(new AppError('Internal server error', 500));
}

/**
 * GET /api/v1/food-logs
 * Retrieves the user's food logs, with optional date filtering.
 */
const getFoodLogs = async (req, res, next) => {
  try {
    const { date } = req.query;
    const foodLogs = await foodLogService.getFoodLogsByUserId(req.user.id, date);

    res.status(200).json({
      status: 'success',
      results: foodLogs.length,
      data: {
        foodLogs
      }
    });
  } catch (err) {
    handleUnexpectedError(err, 'getFoodLogs', next);
  }
};

/**
 * POST /api/v1/food-logs
 * Creates a new food log entry.
 */
const createFoodLog = async (req, res, next) => {
  try {
    const newEntry = await foodLogService.createFoodLogEntry(req.user.id, req.body);

    res.status(201).json({
      status: 'success',
      data: {
        foodLog: newEntry
      }
    });
  } catch (err) {
    handleUnexpectedError(err, 'createFoodLog', next);
  }
};

/**
 * PUT /api/v1/food-logs/:id
 * Updates an existing food log entry.
 */
const updateFoodLog = async (req, res, next) => {
  try {
    const updatedEntry = await foodLogService.updateFoodLogEntry(
      req.user.id,
      req.params.id,
      req.body
    );

    if (!updatedEntry) {
      return next(new AppError('Food log entry not found or unauthorized.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        foodLog: updatedEntry
      }
    });
  } catch (err) {
    handleUnexpectedError(err, 'updateFoodLog', next);
  }
};

/**
 * DELETE /api/v1/food-logs/:id
 * Deletes an existing food log entry.
 */
const deleteFoodLog = async (req, res, next) => {
  try {
    const deleted = await foodLogService.deleteFoodLogEntry(req.user.id, req.params.id);

    if (!deleted) {
      return next(new AppError('Food log entry not found or unauthorized.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    handleUnexpectedError(err, 'deleteFoodLog', next);
  }
};

module.exports = {
  getFoodLogs,
  createFoodLog,
  updateFoodLog,
  deleteFoodLog
};
