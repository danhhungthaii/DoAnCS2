const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  generateQR,
} = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');

/**
 * Event Routes - Tất cả đều cần authenticate
 */

// @route   GET /api/events
// @desc    Lấy danh sách sự kiện
// @access  Private
router.get('/', authenticate, getAllEvents);

// @route   POST /api/events
// @desc    Tạo sự kiện mới
// @access  Private
router.post('/', authenticate, createEvent);

// @route   GET /api/events/:id
// @desc    Lấy chi tiết sự kiện
// @access  Private
router.get('/:id', authenticate, getEventById);

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

module.exports = router;
