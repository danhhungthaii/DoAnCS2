const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {String} userId - User ID
 * @param {String} userType - 'admin' hoặc 'student'
 * @returns {String} JWT Token
 */
const generateToken = (userId, userType = 'admin') => {
  return jwt.sign(
    { id: userId, type: userType }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Verify JWT Token
 * @param {String} token - JWT Token
 * @returns {Object} Decoded token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token hết hạn');
    }
    throw new Error('Token không hợp lệ');
  }
};

module.exports = { generateToken, verifyToken };
