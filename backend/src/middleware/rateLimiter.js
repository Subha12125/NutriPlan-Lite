const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Limiter for authentication routes (Register, Login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // limit each IP to 15 login/register requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for auth route from IP: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
});

// General API request limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // limit each IP to 300 API requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests. Please slow down.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for API from IP: ${req.ip} - ${req.method} ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
