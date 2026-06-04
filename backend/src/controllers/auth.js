const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { createDefaultProfile } = require('../services/profile');
const { AppError } = require('../middleware/error');

// Generate a secure verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Get verification token expiration (24 hours from now)
const getTokenExpiration = () => {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  return expires;
};

/**
 * Sign JWT token for a user ID
 */
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_nutriplan_token_key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

/**
 * POST /api/v1/auth/register
 * Registers a user and generates email verification token.
 * User must verify email before they can log in.
 */
const register = async (req, res, next) => {
  const { email, password } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1) Check if user already exists
    const userCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      throw new AppError('A user with that email already exists.', 400);
    }

    // 2) Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3) Generate email verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiration = getTokenExpiration();

    // 4) Create user with email_verified = false
    const newUserResult = await client.query(
      `INSERT INTO users (email, password_hash, email_verified, verification_token, verification_token_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, created_at`,
      [email, hashedPassword, false, verificationToken, tokenExpiration]
    );
    const newUser = newUserResult.rows[0];

    // 5) Create default profile linked to the user
    await createDefaultProfile(newUser.id, client);

    await client.query('COMMIT');

    // 6) Return registration success with verification instructions
    // In production, send verification email with token to user's email address
    res.status(201).json({
      status: 'success',
      message: 'Registration successful. Please verify your email to activate your account.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          email_verified: false,
          created_at: newUser.created_at
        },
        verificationRequired: true,
        // In development, expose token for testing (remove in production!)
        ...(process.env.NODE_ENV === 'development' && { verificationToken })
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/v1/auth/login
 * Validates credentials and generates JWT.
 * Requires email to be verified before login is allowed.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1) Lookup user and check email verification status
    const userResult = await db.query(
      'SELECT id, email, password_hash, email_verified FROM users WHERE email = $1',
      [email]
    );
    const user = userResult.rows[0];

    // 2) Guard: ensure user exists before attempting hash comparison
    if (!user) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    // 3) Check if email is verified before allowing login
    if (!user.email_verified) {
      return next(new AppError('Please verify your email before logging in. Check your inbox for the verification link.', 403));
    }

    // 4) Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    // 5) Generate JWT and return
    const token = signToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          email: user.email
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/verify-email
 * Verifies user email using the verification token sent to their email.
 * After verification, user can log in.
 */
const verifyEmail = async (req, res, next) => {
  const { token } = req.body;

  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return next(new AppError('Verification token is required.', 400));
    }

    // Find user with matching verification token that hasn't expired
    const userResult = await db.query(
      `SELECT id, email FROM users
       WHERE verification_token = $1
       AND verification_token_expires_at > NOW()
       AND email_verified = false`,
      [token]
    );

    const user = userResult.rows[0];
    if (!user) {
      return next(new AppError('Invalid or expired verification token.', 400));
    }

    // Mark email as verified and clear verification token
    await db.query(
      `UPDATE users
       SET email_verified = true, verification_token = NULL, verification_token_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully. You can now log in.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          email_verified: true
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 * Confirms successful logout (stateless).
 */
const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.'
  });
};

module.exports = {
  register,
  login,
  verifyEmail,
  logout
};
