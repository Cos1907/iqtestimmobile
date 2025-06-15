const express = require('express');
const router = express.Router();
const { getAppConfig, updateAppConfig, getErrorLogs, getCombinedLogs, makeSuperAdmin } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Get and update App Configuration
router.route('/config').get(protect, authorizeRoles('admin', 'super_admin'), getAppConfig).put(protect, authorizeRoles('super_admin'), updateAppConfig);

// Get error logs
router.get('/logs/error', protect, authorizeRoles('super_admin'), getErrorLogs);

// Get combined logs
router.get('/logs/combined', protect, authorizeRoles('super_admin'), getCombinedLogs);

// TEMPORARY: Make a user super_admin for initial setup
router.put('/make-super-admin', protect, authorizeRoles('admin', 'super_admin'), makeSuperAdmin);

module.exports = router; 