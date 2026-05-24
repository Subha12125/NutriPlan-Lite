const db = require('../config/db');
const logger = require('../utils/logger');

const getFoodLogs = async (userId, date) => {
  const query = `
    SELECT id, log_date, meal_type, food_name, quantity_grams, calories, protein, carbs, fat, created_at 
    FROM public.food_logs 
    WHERE user_id = $1 AND log_date = $2 
    ORDER BY created_at ASC
  `;
  const result = await db.query(query, [userId, date]);
  return result.rows;
};

const addFoodLog = async (userId, data) => {
  const {
    log_date,
    meal_type,
    food_name,
    quantity_grams,
    calories,
    protein,
    carbs,
    fat,
  } = data;

  const query = `
    INSERT INTO public.food_logs (
      user_id, log_date, meal_type, food_name, quantity_grams, calories, protein, carbs, fat
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING id, log_date, meal_type, food_name, quantity_grams, calories, protein, carbs, fat, created_at
  `;

  const values = [
    userId,
    log_date || new Date().toISOString().split('T')[0],
    meal_type,
    food_name,
    parseFloat(quantity_grams || 100),
    Math.round(parseFloat(calories || 0)),
    parseFloat(protein || 0),
    parseFloat(carbs || 0),
    parseFloat(fat || 0),
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

const updateFoodLog = async (userId, logId, data) => {
  const {
    meal_type,
    food_name,
    quantity_grams,
    calories,
    protein,
    carbs,
    fat,
  } = data;

  const query = `
    UPDATE public.food_logs 
    SET meal_type = COALESCE($1, meal_type), 
        food_name = COALESCE($2, food_name), 
        quantity_grams = COALESCE($3, quantity_grams), 
        calories = COALESCE($4, calories), 
        protein = COALESCE($5, protein), 
        carbs = COALESCE($6, carbs), 
        fat = COALESCE($7, fat) 
    WHERE id = $8 AND user_id = $9 
    RETURNING id, log_date, meal_type, food_name, quantity_grams, calories, protein, carbs, fat, created_at
  `;

  const values = [
    meal_type || null,
    food_name || null,
    quantity_grams !== undefined ? parseFloat(quantity_grams) : null,
    calories !== undefined ? Math.round(parseFloat(calories)) : null,
    protein !== undefined ? parseFloat(protein) : null,
    carbs !== undefined ? parseFloat(carbs) : null,
    fat !== undefined ? parseFloat(fat) : null,
    logId,
    userId,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

const deleteFoodLog = async (userId, logId) => {
  const query = `
    DELETE FROM public.food_logs 
    WHERE id = $1 AND user_id = $2 
    RETURNING id, food_name
  `;
  const result = await db.query(query, [logId, userId]);
  return result.rows[0];
};

module.exports = {
  getFoodLogs,
  addFoodLog,
  updateFoodLog,
  deleteFoodLog,
};
