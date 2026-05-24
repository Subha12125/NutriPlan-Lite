const winston = require('winston');

const logFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
  return `[${timestamp}] [${level}]: ${stack || message}`;
});

// Derive safe log level from NODE_ENV when LOG_LEVEL env var is not explicitly set.
// development → debug (full verbosity)
// production  → warn (suppresses info/http/verbose/debug)
// anything else → info
const defaultLevel =
  process.env.NODE_ENV === 'production' ? 'warn' :
  process.env.NODE_ENV === 'development' ? 'debug' :
  'info';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || defaultLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), logFormat)
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = logger;
