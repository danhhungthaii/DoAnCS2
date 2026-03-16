const express = require('express');
const router = express.Router();
const {
  getAttendancesByEvent,
  getTodayAttendances,
  checkIn,
  getAttendanceStats,
  getMyAttendanceHistory,
  getPendingVerifications,
  verifyAttendance,
  getMyPoints,
  getLeaderboard,
} = require('../controllers/attendanceController');
const { authenticate, authenticateStudent } = require('../middleware/auth');
const { uploadEvidenceWithErrorHandling } = require('../config/upload');

/**
 * Attendance Routes
 */

// @route   GET /api/attendances/my-history
// @desc    Lấy lịch sử điểm danh của sinh viên đang đăng nhập
// @access  Private (Student)
router.get('/my-history', authenticateStudent, getMyAttendanceHistory);

// @route   GET /api/attendances/my-points
// @desc    Lấy điểm của sinh viên
// @access  Private (Student)
router.get('/my-points', authenticateStudent, getMyPoints);

// @route   GET /api/attendances/leaderboard
// @desc    Bảng xếp hạng
// @access  Public
router.get('/leaderboard', getLeaderboard);

// @route   GET /api/attendances/pending-verification
// @desc    Lấy danh sách điểm danh chờ xác minh
// @access  Private (Admin)
router.get('/pending-verification', authenticate, getPendingVerifications);

// @route   GET /api/attendances/today
// @desc    Lấy danh sách điểm danh hôm nay
// @access  Private
router.get('/today', authenticate, getTodayAttendances);

// @route   GET /api/attendances/event/:eventId
// @desc    Lấy danh sách điểm danh theo sự kiện
// @access  Private
router.get('/event/:eventId', authenticate, getAttendancesByEvent);

// @route   POST /api/attendances/check-in
// @desc    Check-in điểm danh (with optional photo evidence)
// @access  Public (hoặc student auth)
router.post('/check-in', uploadEvidenceWithErrorHandling, checkIn);

// @route   PUT /api/attendances/:id/verify
// @desc    Xác minh điểm danh (approve/reject)
// @access  Private (Admin)
router.put('/:id/verify', authenticate, verifyAttendance);

// @route   GET /api/attendances/stats/:eventId
// @desc    Thống kê điểm danh
// @access  Private
router.get('/stats/:eventId', authenticate, getAttendanceStats);

module.exports = router;
