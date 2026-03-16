const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllSuspiciousActivities,
  getSuspiciousActivityById,
  updateActivityStatus,
  getSuspiciousStats,
  getStudentSuspiciousHistory
} = require('../controllers/suspiciousActivityController');

// Tất cả routes đều cần authentication
router.use(authenticate);

// GET /api/admin/suspicious-activities - Lấy danh sách
router.get('/', getAllSuspiciousActivities);

// GET /api/admin/suspicious-activities/stats/summary - Thống kê
router.get('/stats/summary', getSuspiciousStats);

// GET /api/admin/suspicious-activities/student/:studentId - Lịch sử của sinh viên
router.get('/student/:studentId', getStudentSuspiciousHistory);

// GET /api/admin/suspicious-activities/:id - Chi tiết
router.get('/:id', getSuspiciousActivityById);

// PUT /api/admin/suspicious-activities/:id/status - Cập nhật trạng thái
router.put('/:id/status', updateActivityStatus);

module.exports = router;
