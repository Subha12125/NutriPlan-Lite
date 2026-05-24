require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');
const initDb = require('./src/config/initDb');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 4000;

// Test DB Connection and Start Server
async function startServer() {
  try {
    logger.info('Verifying database connection pool...');
    await db.query('SELECT 1');
    logger.info('Database connection pool verified successfully.');

    // Bootstrap Database Tables
    await initDb();

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await db.pool.end();
          logger.info('Database pool closed.');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing database pool during shutdown', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Database connection failed. Server cannot start.', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception! Server shutting down...', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection! Server shutting down...', err);
  process.exit(1);
});

startServer();
