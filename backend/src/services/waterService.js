const db = require('../config/db');
const logger = require('../utils/logger');

const getWaterLogs = async (userId, date) => {
  const query = `
    SELECT id, log_date, amount_ml, created_at 
    FROM public.water_logs 
    WHERE user_id = $1 AND log_date = $2 
    ORDER BY created_at ASC
  `;
  const result = await db.query(query, [userId, date]);
  return result.rows;
};

const addWaterLog = async (userId, data) => {
  const { log_date, amount_ml } = data;
  const query = `
    INSERT INTO public.water_logs (user_id, log_date, amount_ml) 
    VALUES ($1, $2, $3) 
    RETURNING id, log_date, amount_ml, created_at
  `;
  const values = [
    userId,
    log_date || new Date().toISOString().split('T')[0],
    parseInt(amount_ml || 250),
  ];
  const result = await db.query(query, values);
  return result.rows[0];
};

const resetWaterLogs = async (userId, date) => {
  const query = `
    DELETE FROM public.water_logs 
    WHERE user_id = $1 AND log_date = $2 
    RETURNING id, amount_ml
  `;
  const result = await db.query(query, [userId, date]);
  return result.rows;
};

module.exports = {
  getWaterLogs,
  addWaterLog,
  resetWaterLogs,
};
