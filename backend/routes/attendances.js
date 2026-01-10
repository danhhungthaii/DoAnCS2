const express = require('express');
const router = express.Router();
const {
  getAttendancesByEvent,
  checkIn,
  getAttendanceStats,
} = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

/**
 * Attendance Routes
 */

// @route   GET /api/attendances/event/:eventId
// @desc    Lấy danh sách điểm danh theo sự kiện
// @access  Private
router.get('/event/:eventId', authenticate, getAttendancesByEvent);

// @route   POST /api/attendances/check-in
// @desc    Check-in điểm danh
// @access  Public (hoặc student auth)
router.post('/check-in', checkIn);

// @route   GET /api/attendances/stats/:eventId
// @desc    Thống kê điểm danh
// @access  Private
router.get('/stats/:eventId', authenticate, getAttendanceStats);

module.exports = router;
