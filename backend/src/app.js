const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const foodRoutes = require('./routes/foodRoutes');
const waterRoutes = require('./routes/waterRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Load Environment Configuration
require('dotenv').config();

// 1. Security Middleware
app.use(helmet());
app.use(cors());

// 2. Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. HTTP Request Logging Middleware (Morgan integrated with Winston)
const morganStream = {
  write: (message) => logger.http(message.trim()),
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/food-logs', foodRoutes);
app.use('/api/v1/water-logs', waterRoutes);

// 4. Health Check Endpoint (GET /api/v1/health)
app.get('/api/v1/health', async (req, res, next) => {
  try {
    // Verify database connectivity
    const dbCheck = await db.query('SELECT NOW()');
    
    res.status(200).json({
      status: 'success',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: 'connected',
          time: dbCheck.rows[0].now,
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      status: 'error',
      message: 'Server health degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: 'disconnected',
          error: error.message,
        },
      },
    });
  }
});

// 5. Catch-All 404 Route handler
app.use((req, res, next) => {
  const err = new Error(`Route Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// 6. Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
