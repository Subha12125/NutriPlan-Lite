const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Accept standard "Bearer <token>" or just the raw token
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader);

  if (!token) {
    logger.warn(`Auth failed: Missing token on ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Access token is required. Please authenticate.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_nutriplan_token_key');
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    logger.warn(`Auth failed: Invalid/expired token on ${req.method} ${req.originalUrl} - Error: ${error.message}`);
    return res.status(403).json({
      status: 'error',
      statusCode: 403,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

module.exports = {
  authenticateToken,
};
