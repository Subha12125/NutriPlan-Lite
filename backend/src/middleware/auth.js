const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { AppError } = require('./error');

/**
 * Route protection middleware. Checks Authorization header for a valid Bearer JWT.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1) Verify presence of authorization header and Bearer token format
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to obtain access.', 401)
      );
    }

    // 2) Verify the JWT signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (err) {
      // Distinguish expired tokens from other JWT errors (malformed, bad signature, etc.)
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      return next(
        new AppError('Invalid or expired authentication token. Please log in again.', 401)
      );
    }

    // 3) Confirm that the user still exists and the token has not been revoked.
    //    token_version is incremented on logout, so any token issued before the
    //    last logout will carry a stale version and is rejected here.
    const userResult = await db.query(
      'SELECT id, email, token_version FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    const currentUser = userResult.rows[0];

    // Only enforce the version check if the token actually carries the field.
    // Tokens issued before this migration was applied will not have it, so we
    // allow them through once and they pick up a versioned token on next login.
    if (
      decoded.version !== undefined &&
      decoded.version !== currentUser.token_version
    ) {
      return next(
        new AppError('Your session has been revoked. Please log in again.', 401)
      );
    }

    // 4) Attach user object to request and proceed
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  protect
};
