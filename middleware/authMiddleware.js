const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        logger.warn(`Unauthorized access attempt: User not found for ID ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      logger.error('Auth middleware error: Token verification failed', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    logger.warn('Unauthorized access attempt: No token provided');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt: User ${req.user ? req.user.email : 'unknown'} with role ${req.user ? req.user.role : 'none'} tried to access restricted resource.`);
      return res.status(403).json({ message: `User role ${req.user ? req.user.role : ''} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles }; 