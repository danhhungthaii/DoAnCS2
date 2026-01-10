const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

/**
 * Student Routes - Tất cả đều cần authenticate
 */

// @route   GET /api/students
// @desc    Lấy danh sách sinh viên
// @access  Private
router.get('/', authenticate, getAllStudents);

// @route   POST /api/students
// @desc    Thêm sinh viên mới
// @access  Private
router.post('/', authenticate, createStudent);

// @route   GET /api/students/:id
// @desc    Lấy thông tin sinh viên
// @access  Private
router.get('/:id', authenticate, getStudentById);

// @route   PUT /api/students/:id
// @desc    Cập nhật sinh viên
// @access  Private
router.put('/:id', authenticate, updateStudent);

// @route   DELETE /api/students/:id
// @desc    Xóa sinh viên
// @access  Private
router.delete('/:id', authenticate, deleteStudent);

module.exports = router;
