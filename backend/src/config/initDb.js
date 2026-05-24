const db = require('./db');
const logger = require('../utils/logger');

const initDb = async () => {
  try {
    logger.info('Initializing database tables...');
    
    // Enable uuid-ossp extension if not enabled (required for gen_random_uuid() on older postgres, otherwise native works)
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // 1. Create Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Create Profiles Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        age INTEGER NOT NULL DEFAULT 25,
        weight NUMERIC NOT NULL DEFAULT 70,
        height NUMERIC NOT NULL DEFAULT 175,
        gender VARCHAR(10) NOT NULL DEFAULT 'male',
        activity_level NUMERIC NOT NULL DEFAULT 1.2,
        fitness_goal VARCHAR(20) NOT NULL DEFAULT 'maintain',
        macro_split VARCHAR(20) NOT NULL DEFAULT 'balanced',
        custom_carbs NUMERIC DEFAULT 45,
        custom_protein NUMERIC DEFAULT 25,
        custom_fat NUMERIC DEFAULT 30,
        water_target INTEGER NOT NULL DEFAULT 2500,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Create Food Logs Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.food_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        meal_type VARCHAR(20) NOT NULL,
        food_name TEXT NOT NULL,
        quantity_grams NUMERIC NOT NULL DEFAULT 100,
        calories INTEGER NOT NULL DEFAULT 0,
        protein NUMERIC NOT NULL DEFAULT 0,
        carbs NUMERIC NOT NULL DEFAULT 0,
        fat  NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Create Water Logs Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.water_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        amount_ml INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    logger.info('Database tables initialized successfully.');
  } catch (error) {
    logger.error('Failed to initialize database tables', error);
    throw error;
  }
};

module.exports = initDb;
