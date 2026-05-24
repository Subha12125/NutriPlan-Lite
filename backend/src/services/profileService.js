const db = require('../config/db');
const logger = require('../utils/logger');

const getProfileByUserId = async (userId) => {
  const query = `
    SELECT u.email, p.age, p.weight, p.height, p.gender, p.activity_level, 
           p.fitness_goal, p.macro_split, p.custom_carbs, p.custom_protein, 
           p.custom_fat, p.water_target, p.updated_at 
    FROM public.users u 
    JOIN public.profiles p ON u.id = p.user_id 
    WHERE u.id = $1
  `;
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

const updateProfile = async (userId, data) => {
  const {
    age,
    weight,
    height,
    gender,
    activity_level,
    fitness_goal,
    macro_split,
    custom_protein,
    custom_carbs,
    custom_fat,
    water_target,
  } = data;

  // Retrieve current profile to support proper validation and coalescing of custom macros
  const currentQuery = await db.query(
    'SELECT macro_split, custom_protein, custom_carbs, custom_fat FROM public.profiles WHERE user_id = $1',
    [userId]
  );

  if (currentQuery.rows.length === 0) {
    return null;
  }

  const currentProfile = currentQuery.rows[0];

  // Perform macro validation checks
  const split = macro_split !== undefined ? macro_split : currentProfile.macro_split;
  const cp = custom_protein !== undefined ? parseInt(custom_protein) : (currentProfile.custom_protein !== null ? parseInt(currentProfile.custom_protein) : 25);
  const cc = custom_carbs !== undefined ? parseInt(custom_carbs) : (currentProfile.custom_carbs !== null ? parseInt(currentProfile.custom_carbs) : 45);
  const cf = custom_fat !== undefined ? parseInt(custom_fat) : (currentProfile.custom_fat !== null ? parseInt(currentProfile.custom_fat) : 30);

  if (split === 'custom' && (cp + cc + cf !== 100)) {
    const error = new Error(`Custom macro percentages must add up to exactly 100%. (Currently: ${cp + cc + cf}%)`);
    error.statusCode = 400;
    throw error;
  }

  const query = `
    UPDATE public.profiles 
    SET age = COALESCE($1, age), 
        weight = COALESCE($2, weight), 
        height = COALESCE($3, height), 
        gender = COALESCE($4, gender), 
        activity_level = COALESCE($5, activity_level), 
        fitness_goal = COALESCE($6, fitness_goal), 
        macro_split = COALESCE($7, macro_split), 
        custom_protein = COALESCE($8, custom_protein), 
        custom_carbs = COALESCE($9, custom_carbs), 
        custom_fat = COALESCE($10, custom_fat), 
        water_target = COALESCE($11, water_target), 
        updated_at = NOW() 
    WHERE user_id = $12 
    RETURNING *
  `;

  const values = [
    age !== undefined ? parseInt(age) : null,
    weight !== undefined ? parseFloat(weight) : null,
    height !== undefined ? parseFloat(height) : null,
    gender || null,
    activity_level !== undefined ? parseFloat(activity_level) : null,
    fitness_goal || null,
    macro_split || null,
    custom_protein !== undefined ? parseInt(custom_protein) : null,
    custom_carbs !== undefined ? parseInt(custom_carbs) : null,
    custom_fat !== undefined ? parseInt(custom_fat) : null,
    water_target !== undefined ? parseInt(water_target) : null,
    userId,
  ];

  const result = await db.query(query, values);
  return result.rows[0];
};

module.exports = {
  getProfileByUserId,
  updateProfile,
};
