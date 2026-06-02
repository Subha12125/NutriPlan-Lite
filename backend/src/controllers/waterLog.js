const waterLogService = require('../services/waterLog');
const { AppError } = require('../middleware/error');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates date query parameter format.
 * Returns true if date is valid or not provided; calls next(error) and returns false if invalid.
 */
function validateDateParam(date, next) {
  if (date && !DATE_REGEX.test(date)) {
    next(new AppError('Date must be in YYYY-MM-DD format.', 400));
    return false;
  }
  return true;
}

/**
 * GET /api/v1/water-logs
 * Retrieves all water log entries, with optional date filtering.
 * Aggregates total amount of water consumed.
 * Query parameter:
 *   - date: (optional) Filter logs to a specific date (YYYY-MM-DD format)
 */
const getWaterLogs = async (req, res, next) => {
  const { date } = req.query;

  // Validate date format before querying database
  if (!validateDateParam(date, next)) {
    return;
  }

  try {
    const waterLogs = await waterLogService.getWaterLogsByUserId(req.user.id, date);

    // Calculate sum of water consumed for the filtered list
    const totalConsumed = waterLogs.reduce((sum, log) => sum + parseInt(log.amount_ml || 0, 10), 0);

    res.status(200).json({
      status: 'success',
      results: waterLogs.length,
      data: {
        totalConsumed,
        waterLogs
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/water-logs
 * Creates a new water log entry.
 */
const createWaterLog = async (req, res, next) => {
  const { amount_ml, log_date } = req.body;

  try {
    const newEntry = await waterLogService.createWaterLogEntry(
      req.user.id,
      amount_ml,
      log_date
    );

    res.status(201).json({
      status: 'success',
      data: {
        waterLog: newEntry
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/water-logs/reset
 * Deletes all water logs for a specific user and date (resets daily consumption to 0).
 * Query parameter:
 *   - date: (optional) Delete logs for a specific date (YYYY-MM-DD format); if omitted, defaults to today
 */
const resetWaterLogs = async (req, res, next) => {
  const { date } = req.query;

  // Validate date format before querying database
  if (!validateDateParam(date, next)) {
    return;
  }

  try {
    await waterLogService.resetWaterLogsByDate(req.user.id, date);

    res.status(200).json({
      status: 'success',
      message: 'Water logs reset successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/water-logs/:id
 * Deletes a specific water log entry.
 */
const deleteWaterLog = async (req, res, next) => {
  try {
    const deleted = await waterLogService.deleteWaterLogEntry(req.user.id, req.params.id);

    if (!deleted) {
      return next(new AppError('Water log entry not found or unauthorized.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWaterLogs,
  createWaterLog,
  resetWaterLogs,
  deleteWaterLog
};
