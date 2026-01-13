const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const {
  importStudents,
  downloadTemplate,
  exportStudents
} = require('../controllers/importController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * Student Routes - Tất cả đều cần authenticate
 */

// @route   GET /api/students/template
// @desc    Download template Excel mẫu
// @access  Private
router.get('/template', authenticate, downloadTemplate);

// @route   GET /api/students/export
// @desc    Export danh sách sinh viên ra Excel
// @access  Private
router.get('/export', authenticate, exportStudents);

// @route   POST /api/students/import
// @desc    Import sinh viên từ file Excel
// @access  Private
router.post('/import', authenticate, upload.single('file'), importStudents);

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
