const db = require('../config/db');
const { AppError } = require('../middleware/error');


const FOOD_LOG_DEFAULT_LIMIT = 50;
const FOOD_LOG_MAX_LIMIT = 200;

/**
 * Retrieves food log entries for a user with optional date filter and pagination.
 *
 * When a date filter is supplied the daily count is inherently bounded so
 * pagination is skipped and all matching rows are returned.
 *
 * When no date is supplied, page and limit control the result window.
 * Returns { rows, total } where total is the full count for the user/date
 * partition (used by the caller to build pagination metadata).
 */
const getFoodLogsByUserId = async (userId, date = null, page = 1, limit = FOOD_LOG_DEFAULT_LIMIT) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || FOOD_LOG_DEFAULT_LIMIT, 1), FOOD_LOG_MAX_LIMIT);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const baseSelect = `
    SELECT id, user_id, log_date, food_name, quantity_grams, calories, protein, carbs, fat, meal_type, created_at
    FROM food_logs
    WHERE user_id = $1
  `;
  const countSelect = `SELECT COUNT(*) FROM food_logs WHERE user_id = $1`;
  const queryParams = [userId];

  if (date) {
    // Date-filtered: return all entries for that day without pagination.
    const dataQuery = baseSelect + ' AND log_date = $2 ORDER BY created_at DESC';
    const countQuery = countSelect + ' AND log_date = $2';
    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, [userId, date]),
      db.query(countQuery, [userId, date])
    ]);
    return { rows: dataResult.rows, total: parseInt(countResult.rows[0].count, 10) };
  }

  // No date filter: apply pagination.
  const dataQuery = baseSelect + ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
  queryParams.push(safeLimit, offset);
  const [dataResult, countResult] = await Promise.all([
    db.query(dataQuery, queryParams),
    db.query(countSelect, [userId])
  ]);
  return { rows: dataResult.rows, total: parseInt(countResult.rows[0].count, 10) };
};

/**
 * Creates a new food log entry.
 */
const createFoodLogEntry = async (userId, logData) => {
  // Explicitly reject any caller-supplied id. Accepting a client-provided
  // primary key allows force-inserting records with arbitrary UUIDs, enabling
  // collisions with existing entries or reservation of future IDs. The
  // database generates the id; callers must never supply one.
  if (logData.id !== undefined) {
    throw new AppError('The id field cannot be supplied by the caller.', 400);
  }

  const {
    food_name,
    quantity_grams,
    calories,
    protein,
    carbs,
    fat,
    meal_type,
    log_date
  } = logData;

  // Accept 0 calories explicitly; reject null / undefined / non-numeric values.
  // Number(null) === 0 which would silently accept null, so guard first.
  if (calories === null || calories === undefined) {
    throw new AppError('Calories must be provided.', 400);
  }
  const caloriesNum = Number(calories);
  if (!Number.isFinite(caloriesNum) || caloriesNum < 0) {
    throw new AppError('Calories must be a non-negative number.', 400);
  }

  const queryText = `
    INSERT INTO food_logs
      (user_id, food_name, quantity_grams, calories, protein, carbs, fat, meal_type, log_date)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_DATE))
    RETURNING id, user_id, log_date, food_name, quantity_grams, calories, protein, carbs, fat, meal_type, created_at
  `;
  const queryParams = [
    userId,
    food_name,
    quantity_grams,
    calories,
    protein,
    carbs,
    fat,
    meal_type,
    log_date || null
  ];

  const result = await db.query(queryText, queryParams);
  return result.rows[0];
};

/**
 * Dynamically updates an existing food log entry.
 * Checks that the log entry belongs to the user.
 */
const updateFoodLogEntry = async (userId, logId, updateData) => {
  const allowedFields = [
    'food_name',
    'quantity_grams',
    'calories',
    'protein',
    'carbs',
    'fat',
    'meal_type',
    'log_date'
  ];

  const setClause = [];
  const queryValues = [];
  let paramIndex = 1;

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      setClause.push(`${field} = $${paramIndex}`);
      queryValues.push(updateData[field]);
      paramIndex++;
    }
  });

  if (setClause.length === 0) return null;

  // Add log ID and user ID to check criteria
  queryValues.push(logId);
  const logIdParam = paramIndex;
  paramIndex++;

  queryValues.push(userId);
  const userIdParam = paramIndex;

  const queryText = `
    UPDATE food_logs 
    SET ${setClause.join(', ')} 
    WHERE id = $${logIdParam} AND user_id = $${userIdParam} 
    RETURNING id, user_id, log_date, food_name, quantity_grams, calories, protein, carbs, fat, meal_type, created_at
  `;

  const result = await db.query(queryText, queryValues);
  return result.rows[0];
};

/**
 * Deletes a food log entry.
 * Checks that the log entry belongs to the user.
 */
const deleteFoodLogEntry = async (userId, logId) => {
  const queryText = `
    DELETE FROM food_logs 
    WHERE id = $1 AND user_id = $2 
    RETURNING id
  `;
  const result = await db.query(queryText, [logId, userId]);
  return result.rows[0];
};

module.exports = {
  getFoodLogsByUserId,
  createFoodLogEntry,
  updateFoodLogEntry,
  deleteFoodLogEntry
};
