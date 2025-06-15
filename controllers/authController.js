const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Please add all fields' });
    return;
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  try {
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      emailVerified: false, // Default to false on registration
    });

    if (user) {
      logger.info(`User registered: ${user.email}`);
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    logger.error(`Error during user registration for email ${email}:`, error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Please enter email and password' });
    return;
  }

  // Check for user email
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400).json({ message: 'Invalid credentials' });
    return;
  }

  try {
    // Compare password
    if (await user.matchPassword(password)) {
      logger.info(`User logged in: ${user.email}`);
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error(`Error during user login for email ${email}:`, error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Request email verification (mock for now)
// @route   POST /api/auth/send-verification-email
// @access  Private
const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  // In a real app, you would send an actual email here
  // For now, just log and simulate success
  logger.info(`Simulating email verification sent to: ${email}`);
  res.status(200).json({ message: 'Verification email sent successfully (simulated)' });
};

// @desc    Verify email (mock for now)
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  const { token } = req.params;
  // In a real app, you would verify the token and update user's emailVerified status
  // For now, just log and simulate success
  logger.info(`Simulating email verification for token: ${token}`);
  res.status(200).json({ message: 'Email verified successfully (simulated)' });
};

// @desc    Get user data (for current user)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    _id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    emailVerified: req.user.emailVerified,
  });
};

module.exports = { registerUser, loginUser, getMe, sendVerificationEmail, verifyEmail }; 