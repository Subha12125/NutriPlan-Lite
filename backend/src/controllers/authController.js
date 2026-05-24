const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  const { email, password } = req.body;
  const client = await db.pool.connect();

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const checkUser = await client.query('SELECT id FROM public.users WHERE email = $1', [normalizedEmail]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Email address is already registered.',
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start Transaction
    await client.query('BEGIN');

    // 1. Insert User
    const userInsert = await client.query(
      'INSERT INTO public.users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [normalizedEmail, passwordHash]
    );
    const newUser = userInsert.rows[0];

    // 2. Insert Default Profile
    await client.query(
      'INSERT INTO public.profiles (user_id) VALUES ($1)',
      [newUser.id]
    );

    // Commit Transaction
    await client.query('COMMIT');

    // Generate JWT Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'super_secret_nutriplan_token_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`User registered successfully: ${newUser.email} (${newUser.id})`);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
        },
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Registration failed', error);
    next(error);
  } finally {
    client.release();
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Find User
    const userQuery = await db.query(
      'SELECT id, email, password_hash FROM public.users WHERE email = $1',
      [normalizedEmail]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid email or password credentials.',
      });
    }

    const user = userQuery.rows[0];

    // Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Invalid email or password credentials.',
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'super_secret_nutriplan_token_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`User logged in successfully: ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
    });

  } catch (error) {
    logger.error('Login failed', error);
    next(error);
  }
};

// POST /api/v1/auth/logout
const logout = (req, res) => {
  // Since JWT is stateless, the server just sends a success response
  // and instructs the client to clear their locally cached token.
  res.status(200).json({
    status: 'success',
    message: 'Logout successful. Please clear the authentication token on the client.',
  });
};

// GET /api/v1/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const profileQuery = await db.query(
      `SELECT u.email, p.age, p.weight, p.height, p.gender, p.activity_level, 
              p.fitness_goal, p.macro_split, p.custom_carbs, p.custom_protein, 
              p.custom_fat, p.water_target, p.updated_at 
       FROM public.users u 
       JOIN public.profiles p ON u.id = p.user_id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: profileQuery.rows[0],
    });

  } catch (error) {
    logger.error(`Get profile failed for user: ${req.user.id}`, error);
    next(error);
  }
};

// PUT /api/v1/auth/profile
const updateProfile = async (req, res, next) => {
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
  } = req.body;

  try {
    // 1. Fetch current profile to handle custom percentage computations/coalescing
    const currentQuery = await db.query(
      'SELECT macro_split, custom_protein, custom_carbs, custom_fat FROM public.profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (currentQuery.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'User profile not found.',
      });
    }

    const currentProfile = currentQuery.rows[0];

    // 2. Validate custom macro split constraints if updating split to custom
    const split = macro_split !== undefined ? macro_split : currentProfile.macro_split;
    let cp = custom_protein !== undefined ? parseInt(custom_protein) : currentProfile.custom_protein;
    let cc = custom_carbs !== undefined ? parseInt(custom_carbs) : currentProfile.custom_carbs;
    let cf = custom_fat !== undefined ? parseInt(custom_fat) : currentProfile.custom_fat;

    if (split === 'custom' && (cp + cc + cf !== 100)) {
      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: `Custom macro percentages must add up to exactly 100%. (Currently: ${cp + cc + cf}%)`,
      });
    }

    // 3. Update profiles table
    const updateQuery = await db.query(
      `UPDATE public.profiles 
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
       RETURNING *`,
      [
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
        req.user.id
      ]
    );

    logger.info(`Profile updated for user: ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updateQuery.rows[0],
    });

  } catch (error) {
    logger.error(`Update profile failed for user: ${req.user.id}`, error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
};
