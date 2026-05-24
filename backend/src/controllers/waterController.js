const waterService = require('../services/waterService');
const logger = require('../utils/logger');

const getWaterLogs = async (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Query parameter "date" is required.',
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Invalid date format. Please use YYYY-MM-DD.',
    });
  }

  try {
    const logs = await waterService.getWaterLogs(req.user.id, date);
    res.status(200).json({
      status: 'success',
      data: logs,
    });
  } catch (error) {
    logger.error(`Get water logs error for user ${req.user.id} on date ${date}`, error);
    next(error);
  }
};

const addWaterLog = async (req, res, next) => {
  const { amount_ml } = req.body;

  if (!amount_ml) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Parameter "amount_ml" is required.',
    });
  }

  const volume = parseInt(amount_ml);
  if (isNaN(volume) || volume <= 0 || volume > 10000) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Parameter "amount_ml" must be a positive integer up to 10,000.',
    });
  }

  try {
    const newLog = await waterService.addWaterLog(req.user.id, req.body);
    logger.info(`Logged water intake: ${newLog.amount_ml}ml for user ${req.user.id}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Water intake logged successfully',
      data: newLog,
    });
  } catch (error) {
    logger.error(`Add water log error for user ${req.user.id}`, error);
    next(error);
  }
};

const resetWaterLogs = async (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Query parameter "date" is required.',
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Invalid date format. Please use YYYY-MM-DD.',
    });
  }

  try {
    const deleted = await waterService.resetWaterLogs(req.user.id, date);
    logger.info(`Reset water logs for user ${req.user.id} on date ${date}`);

    res.status(200).json({
      status: 'success',
      message: 'Water logs reset successfully',
      data: deleted,
    });
  } catch (error) {
    logger.error(`Reset water logs error for user ${req.user.id} on date ${date}`, error);
    next(error);
  }
};

module.exports = {
  getWaterLogs,
  addWaterLog,
  resetWaterLogs,
};
