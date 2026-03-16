const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  generateQR,
  registerForEvent,
  uploadBanner,
  getPredefinedLocations,
} = require('../controllers/eventController');
const { authenticate, authenticateStudent } = require('../middleware/auth');
const { uploadBanner: uploadMiddleware } = require('../config/upload');

/**
 * Event Routes - Tất cả đều cần authenticate
 */

// @route   GET /api/events/predefined-locations
// @desc    Lấy danh sách địa điểm định sẵn
// @access  Public
router.get('/predefined-locations', getPredefinedLocations);

// @route   GET /api/events
// @desc    Lấy danh sách sự kiện
// @access  Public (Student + Admin)
router.get('/', getAllEvents);

// @route   POST /api/events
// @desc    Tạo sự kiện mới
// @access  Private
router.post('/', authenticate, createEvent);

// @route   GET /api/events/:id
// @desc    Lấy chi tiết sự kiện
// @access  Public (Student + Admin)
router.get('/:id', getEventById);

// @route   PUT /api/events/:id
// @desc    Cập nhật sự kiện
// @access  Private
router.put('/:id', authenticate, updateEvent);

// @route   DELETE /api/events/:id
// @desc    Xóa sự kiện
// @access  Private
router.delete('/:id', authenticate, deleteEvent);

// @route   POST /api/events/:id/qr
// @desc    Tạo QR code mới
// @access  Private
router.post('/:id/qr', authenticate, generateQR);

// @route   POST /api/events/:id/register
// @desc    Đăng ký tham gia sự kiện
// @access  Private
router.post('/:id/register', authenticateStudent, registerForEvent);

// @route   POST /api/events/:id/upload-banner
// @desc    Upload banner image cho sự kiện
// @access  Private
router.post('/:id/upload-banner', authenticate, uploadMiddleware.single('banner'), uploadBanner);

module.exports = router;
