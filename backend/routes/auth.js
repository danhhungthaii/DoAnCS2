const express = require('express');
const router = express.Router();
const { register, login, getMe, studentLogin, changePassword } = require('../controllers/authController');
const { authenticate, authenticateStudent, authorizeAdmin } = require('../middleware/auth');

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

// @route   POST /api/auth/student-login
// @desc    Đăng nhập Sinh viên (Android App)
// @access  Public
router.post('/student-login', studentLogin);

// @route   POST /api/auth/change-password
// @desc    Đổi mật khẩu Sinh viên
// @access  Private (Student authenticated)
router.post('/change-password', authenticateStudent, changePassword);

// @route   GET /api/auth/me
// @desc    Lấy thông tin user hiện tại
// @access  Private
router.get('/me', authenticate, getMe);

module.exports = router;
