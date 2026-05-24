const profileService = require('../services/profileService');
const logger = require('../utils/logger');

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Profile not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    logger.error(`Get profile controller error for user: ${req.user.id}`, error);
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updated = await profileService.updateProfile(req.user.id, req.body);
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Profile not found. Cannot update.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (error) {
    logger.error(`Update profile controller error for user: ${req.user.id}`, error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
