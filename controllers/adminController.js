const AppConfig = require('../models/AppConfig');
const { setupLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const logger = setupLogger();
const logDir = path.join(__dirname, '..', 'logs');

// @desc    Get App Configuration
// @route   GET /api/admin/config
// @access  Private/Admin
const getAppConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create({}); // Create default if not exists
    }
    res.status(200).json(config);
  } catch (error) {
    logger.error('Error getting app config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update App Configuration
// @route   PUT /api/admin/config
// @access  Private/SuperAdmin
const updateAppConfig = async (req, res) => {
  try {
    // Ensure only one config document exists
    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create({});
    }

    const updatedConfig = await AppConfig.findByIdAndUpdate(
      config._id,
      req.body,
      { new: true, runValidators: true }
    );
    
    logger.info('App config updated:', updatedConfig.toObject());
    res.status(200).json(updatedConfig);
  } catch (error) {
    logger.error('Error updating app config:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Error Logs
// @route   GET /api/admin/logs/error
// @access  Private/SuperAdmin
const getErrorLogs = async (req, res) => {
  const errorLogPath = path.join(logDir, 'error.log');
  fs.readFile(errorLogPath, 'utf8', (err, data) => {
    if (err) {
      logger.error('Error reading error log file:', err);
      return res.status(500).json({ message: 'Could not read error log file' });
    }
    // Split data by new line and filter out empty strings, then parse JSON
    const logs = data.split('\n').filter(line => line.trim() !== '').map(line => {
      try {
        return JSON.parse(line);
      } catch (parseErr) {
        logger.error('Error parsing log line:', parseErr, 'Line:', line);
        return { raw: line, error: 'Parsing error' };
      }
    });
    res.status(200).json(logs);
  });
};

// @desc    Get Combined Logs
// @route   GET /api/admin/logs/combined
// @access  Private/SuperAdmin
const getCombinedLogs = async (req, res) => {
  const combinedLogPath = path.join(logDir, 'combined.log');
  fs.readFile(combinedLogPath, 'utf8', (err, data) => {
    if (err) {
      logger.error('Error reading combined log file:', err);
      return res.status(500).json({ message: 'Could not read combined log file' });
    }
    const logs = data.split('\n').filter(line => line.trim() !== '').map(line => {
      try {
        return JSON.parse(line);
      } catch (parseErr) {
        logger.error('Error parsing log line:', parseErr, 'Line:', line);
        return { raw: line, error: 'Parsing error' };
      }
    });
    res.status(200).json(logs);
  });
};

// @desc    Make a user super_admin (TEMPORARY - FOR INITIAL SETUP ONLY)
// @route   PUT /api/admin/make-super-admin
// @access  Private/SuperAdmin
const makeSuperAdmin = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'super_admin';
    await user.save();

    logger.info(`User ${user.email} role updated to super_admin by ${req.user.email}`);
    res.status(200).json({ message: `User ${user.email} is now super_admin` });
  } catch (error) {
    logger.error('Error making user super admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAppConfig, updateAppConfig, getErrorLogs, getCombinedLogs, makeSuperAdmin }; 