const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, sendVerificationEmail, verifyEmail } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-verification-email', protect, sendVerificationEmail);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

module.exports = router; 