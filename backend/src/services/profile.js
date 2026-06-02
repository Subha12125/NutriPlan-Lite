const db = require('../config/db');

/**
 * Get profile data for a specific user ID.
 */
const getProfileByUserId = async (userId) => {
  const result = await db.query(
    `SELECT user_id, age, weight, height, gender, activity_level, water_target, 
            custom_carbs, custom_protein, custom_fat, macro_split, fitness_goal, updated_at 
     FROM profiles 
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Creates an empty profile row linked to a user.
 * All demographic fields (age, weight, height, gender, activity_level) are left
 * NULL so calorie and macro calculations are not performed until the user
 * explicitly provides their own values via PATCH /api/v1/profile.
 *
 * A modest default water_target of 2,500 ml is set as a starting point
 * because the UI renders a progress bar on first login; NULL would produce
 * a divide-by-zero in the frontend. Users can update this at any time.
 *
 * Supports passing a database client for running inside PostgreSQL transaction blocks.
 */
const createDefaultProfile = async (userId, dbClient = null) => {
  const executor = dbClient || db;
  const result = await executor.query(
    `INSERT INTO profiles (user_id, water_target)
     VALUES ($1, 2500)
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Dynamically updates profile columns for a user.
 */
const updateProfileByUserId = async (userId, updateData) => {
  const allowedFields = [
    'age',
    'weight',
    'height',
    'gender',
    'activity_level',
    'water_target',
    'custom_carbs',
    'custom_protein',
    'custom_fat',
    'macro_split',
    'fitness_goal'
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

  queryValues.push(userId);
  const queryText = `
    UPDATE profiles 
    SET ${setClause.join(', ')}, updated_at = NOW() 
    WHERE user_id = $${paramIndex} 
    RETURNING user_id, age, weight, height, gender, activity_level, water_target, 
              custom_carbs, custom_protein, custom_fat, macro_split, fitness_goal, updated_at
  `;

  const result = await db.query(queryText, queryValues);
  return result.rows[0];
};

module.exports = {
  getProfileByUserId,
  createDefaultProfile,
  updateProfileByUserId
};
