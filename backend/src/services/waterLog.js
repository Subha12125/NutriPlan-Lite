const db = require('../config/db');
const logger = require('../config/logger');

// Maximum number of water log rows returned in a single query.
// Without a LIMIT the query performs a full user-partition scan and loads
// all historical records into memory, making response time and memory
// usage proportional to the total number of entries ever logged by the user.
const WATER_LOG_MAX_ROWS = 500;

/**
 * Retrieves water log entries for a user, optionally filtered by log_date.
 */
const getWaterLogsByUserId = async (userId, date = null) => {
  try {
    let queryText = `
      SELECT id, user_id, log_date, amount_ml, created_at
      FROM water_logs
      WHERE user_id = $1
    `;
    const queryParams = [userId];

    if (date) {
      queryText += ' AND log_date = $2';
      queryParams.push(date);
    }

    queryText += ` ORDER BY created_at DESC LIMIT ${WATER_LOG_MAX_ROWS}`;

    const result = await db.query(queryText, queryParams);
    return result.rows;
  } catch (err) {
    logger.error(`[waterLog service] getWaterLogsByUserId failed for userId=${userId}: ${err.message}`);
    throw err;
  }
};

/**
 * Inserts a new water log entry.
 */
const createWaterLogEntry = async (userId, amountMl, date = null) => {
  try {
    const queryText = `
      INSERT INTO water_logs (user_id, amount_ml, log_date) 
      VALUES ($1, $2, COALESCE($3, CURRENT_DATE)) 
      RETURNING id, user_id, log_date, amount_ml, created_at
    `;
    const result = await db.query(queryText, [userId, amountMl, date || null]);
    return result.rows[0];
  } catch (err) {
    logger.error(`[waterLog service] createWaterLogEntry failed for userId=${userId}: ${err.message}`);
    throw err;
  }
};

/**
 * Deletes a specific water log entry.
 * Checks that the log entry belongs to the user.
 */
const deleteWaterLogEntry = async (userId, logId) => {
  try {
    const queryText = `
      DELETE FROM water_logs 
      WHERE id = $1 AND user_id = $2 
      RETURNING id
    `;
    const result = await db.query(queryText, [logId, userId]);
    return result.rows[0];
  } catch (err) {
    logger.error(`[waterLog service] deleteWaterLogEntry failed for userId=${userId}, logId=${logId}: ${err.message}`);
    throw err;
  }
};

/**
 * Resets water logs for a specific user and date.
 * Deletes all water logs on that log_date.
 */
const resetWaterLogsByDate = async (userId, date = null) => {
  try {
    const queryText = `
      DELETE FROM water_logs 
      WHERE user_id = $1 AND log_date = COALESCE($2, CURRENT_DATE) 
      RETURNING id
    `;
    const result = await db.query(queryText, [userId, date || null]);
    return result.rows;
  } catch (err) {
    logger.error(`[waterLog service] resetWaterLogsByDate failed for userId=${userId}, date=${date}: ${err.message}`);
    throw err;
  }
};

module.exports = {
  getWaterLogsByUserId,
  createWaterLogEntry,
  deleteWaterLogEntry,
  resetWaterLogsByDate
};
