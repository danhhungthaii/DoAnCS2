const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getEventRegistrations,
  getMyRegistrations,
  cancelRegistration,
  exportRegistrationsExcel,
  getRegistrationStats
} = require('../controllers/registrationController');
const { authenticate, authenticateStudent } = require('../middleware/auth');

/**
 * Registration Routes
 */

// @route   POST /api/registrations
// @desc    Đăng ký tham gia sự kiện
// @access  Private (Student)
router.post('/', authenticateStudent, registerForEvent);

// @route   GET /api/registrations/my-registrations
// @desc    Lấy danh sách đăng ký của sinh viên hiện tại
// @access  Private (Student)
router.get('/my-registrations', authenticateStudent, getMyRegistrations);

// @route   GET /api/registrations/event/:eventId
// @desc    Lấy danh sách đăng ký của 1 sự kiện (Admin)
// @access  Private (Admin)
router.get('/event/:eventId', authenticate, getEventRegistrations);

// @route   GET /api/registrations/event/:eventId/stats
// @desc    Lấy thống kê đăng ký
// @access  Private (Admin)
router.get('/event/:eventId/stats', authenticate, getRegistrationStats);

// @route   GET /api/registrations/event/:eventId/export
// @desc    Export danh sách đăng ký ra Excel
// @access  Private (Admin)
router.get('/event/:eventId/export', authenticate, exportRegistrationsExcel);

// @route   DELETE /api/registrations/:id
// @desc    Hủy đăng ký
// @access  Private (Student - owner only)
router.delete('/:id', authenticateStudent, cancelRegistration);

module.exports = router;
