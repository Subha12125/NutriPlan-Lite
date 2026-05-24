const validateRegister = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Registration validation failed',
      errors,
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Login validation failed',
      errors,
    });
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const {
    age,
    weight,
    height,
    gender,
    activity_level,
    fitness_goal,
    macro_split,
    custom_protein,
    custom_carbs,
    custom_fat,
    water_target,
  } = req.body;
  
  const errors = [];

  if (age !== undefined) {
    const ageVal = parseInt(age);
    if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) {
      errors.push({ field: 'age', message: 'Age must be an integer between 1 and 120' });
    }
  }

  if (weight !== undefined) {
    const weightVal = parseFloat(weight);
    if (isNaN(weightVal) || weightVal < 10 || weightVal > 300) {
      errors.push({ field: 'weight', message: 'Weight must be a number between 10 and 300 kg' });
    }
  }

  if (height !== undefined) {
    const heightVal = parseFloat(height);
    if (isNaN(heightVal) || heightVal < 50 || heightVal > 280) {
      errors.push({ field: 'height', message: 'Height must be a number between 50 and 280 cm' });
    }
  }

  if (gender !== undefined && !['male', 'female'].includes(gender)) {
    errors.push({ field: 'gender', message: 'Gender must be either "male" or "female"' });
  }

  if (activity_level !== undefined) {
    const actVal = parseFloat(activity_level);
    if (isNaN(actVal) || actVal < 1.0 || actVal > 2.5) {
      errors.push({ field: 'activity_level', message: 'Activity level multiplier must be between 1.0 and 2.5' });
    }
  }

  if (fitness_goal !== undefined && !['lose', 'maintain', 'gain'].includes(fitness_goal)) {
    errors.push({ field: 'fitness_goal', message: 'Fitness goal must be "lose", "maintain", or "gain"' });
  }

  if (macro_split !== undefined) {
    if (!['balanced', 'lowcarb', 'highprotein', 'custom'].includes(macro_split)) {
      errors.push({ field: 'macro_split', message: 'Macro split preset must be "balanced", "lowcarb", "highprotein", or "custom"' });
    }
  }

  if (water_target !== undefined) {
    const waterVal = parseInt(water_target);
    if (isNaN(waterVal) || waterVal < 500 || waterVal > 10000) {
      errors.push({ field: 'water_target', message: 'Water target must be an integer between 500 and 10000 ml' });
    }
  }

  // Cross-validation for custom macro splits
  const split = macro_split || (req.user_profile ? req.user_profile.macro_split : null);
  if (split === 'custom') {
    const cp = custom_protein !== undefined ? parseInt(custom_protein) : 25;
    const cc = custom_carbs !== undefined ? parseInt(custom_carbs) : 45;
    const cf = custom_fat !== undefined ? parseInt(custom_fat) : 30;

    if (isNaN(cp) || isNaN(cc) || isNaN(cf) || (cp + cc + cf !== 100)) {
      errors.push({
        field: 'custom_macros',
        message: `Custom macro split percentages must total exactly 100%. Provided: Protein ${cp}%, Carbs ${cc}%, Fat ${cf}% (Total: ${cp + cc + cf}%)`,
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Profile validation failed',
      errors,
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
};
