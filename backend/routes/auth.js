const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

/**
 * Auth Routes
 */

// @route   POST /api/auth/register
// @desc    Đăng ký admin mới (chỉ super-admin)
// @access  Private (Super Admin)
router.post('/register', authenticate, authorizeAdmin, register);

// @route   POST /api/auth/login
// @desc    Đăng nhập
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Lấy thông tin user hiện tại
// @access  Private
router.get('/me', authenticate, getMe);

module.exports = router;
