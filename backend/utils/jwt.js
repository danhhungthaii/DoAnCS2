const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {String} userId - User ID
 * @returns {String} JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
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
    throw new Error('Token không hợp lệ');
  }
};

module.exports = { generateToken, verifyToken };
