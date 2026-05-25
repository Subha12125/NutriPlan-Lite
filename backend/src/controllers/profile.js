const profileService = require('../services/profile');
const { AppError } = require('../middleware/error');

/**
 * GET /api/v1/auth/profile
 * Retrieves the current authenticated user's profile.
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);

    if (!profile) {
      return next(new AppError('Profile not found for this user.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Whitelisted profile fields that may be updated via the API.
 * Any key outside this list that arrives in req.body is silently ignored,
 * preventing mass-assignment of sensitive or internal DB columns.
 */
const ALLOWED_PROFILE_FIELDS = [
  'age',
  'weight',
  'height',
  'gender',
  'activity_level',
  'water_target',
  'custom_carbs',
  'custom_protein',
  'custom_fat',
  'macro_split',
  'fitness_goal'
];

/**
 * PUT /api/v1/auth/profile
 * Updates the current authenticated user's profile.
 * Only whitelisted fields are forwarded to the service layer.
 */
const updateProfile = async (req, res, next) => {
  try {
    // Build a sanitised update object that only includes allowed fields.
    // Unknown / extra fields in req.body are dropped here, not in the DB query.
    const sanitised = {};
    ALLOWED_PROFILE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sanitised[field] = req.body[field];
      }
    });

    const profile = await profileService.updateProfileByUserId(req.user.id, sanitised);

    if (!profile) {
      return next(new AppError('Profile not found to update.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
