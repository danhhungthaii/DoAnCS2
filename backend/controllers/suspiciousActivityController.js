const SuspiciousActivity = require('../models/SuspiciousActivity');
const Student = require('../models/Student');
const Event = require('../models/Event');

/**
 * @desc    Lấy tất cả suspicious activities
 * @route   GET /api/admin/suspicious-activities
 * @access  Private (Admin)
 */
exports.getAllSuspiciousActivities = async (req, res) => {
  try {
    const {
      status,
      minRiskScore,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (minRiskScore) {
      query.riskScore = { $gte: parseInt(minRiskScore) };
    }
    
    if (startDate || endDate) {
      query.detectedAt = {};
      if (startDate) {
        query.detectedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.detectedAt.$lte = new Date(endDate);
      }
    }

    // Execute query với pagination
    const skip = (page - 1) * limit;
    const activities = await SuspiciousActivity.find(query)
      .populate('student', 'studentCode fullName class email phone')
      .populate('event', 'title eventDate startTime location')
      .populate('attendance', 'checkInTime checkInLocation distanceFromEvent')
      .sort({ riskScore: -1, detectedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SuspiciousActivity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: activities
    });
  } catch (error) {
    console.error('Get suspicious activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hoạt động đáng ngờ'
    });
  }
};

/**
 * @desc    Lấy chi tiết một suspicious activity
 * @route   GET /api/admin/suspicious-activities/:id
 * @access  Private (Admin)
 */
exports.getSuspiciousActivityById = async (req, res) => {
  try {
    const activity = await SuspiciousActivity.findById(req.params.id)
      .populate('student', 'studentCode fullName class email phone major')
      .populate('event', 'title eventDate startTime endTime location description')
      .populate('attendance', 'checkInTime checkInLocation distanceFromEvent status')
      .populate('reviewedBy', 'username email');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động đáng ngờ'
      });
    }

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get suspicious activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết hoạt động đáng ngờ'
    });
  }
};

/**
 * @desc    Cập nhật trạng thái suspicious activity
 * @route   PUT /api/admin/suspicious-activities/:id/status
 * @access  Private (Admin)
 */
exports.updateActivityStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!status || !['review', 'flagged', 'resolved', 'false_positive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const activity = await SuspiciousActivity.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        reviewedBy: req.user._id, // Từ middleware authenticate
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('student', 'studentCode fullName class')
     .populate('event', 'title eventDate');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hoạt động đáng ngờ'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: activity
    });
  } catch (error) {
    console.error('Update activity status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái'
    });
  }
};

/**
 * @desc    Lấy thống kê suspicious activities
 * @route   GET /api/admin/suspicious-activities/stats/summary
 * @access  Private (Admin)
 */
exports.getSuspiciousStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.detectedAt = {};
      if (startDate) dateFilter.detectedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.detectedAt.$lte = new Date(endDate);
    }

    // Tổng số activities
    const total = await SuspiciousActivity.countDocuments(dateFilter);

    // Theo status
    const byStatus = await SuspiciousActivity.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Theo risk level
    const byRiskLevel = await SuspiciousActivity.aggregate([
      { $match: dateFilter },
      {
        $bucket: {
          groupBy: '$riskScore',
          boundaries: [0, 30, 60, 90, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Theo anomaly type
    const byType = await SuspiciousActivity.aggregate([
      { $match: dateFilter },
      { $unwind: '$anomalies' },
      {
        $group: {
          _id: '$anomalies.type',
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top students với nhiều suspicious activities
    const topStudents = await SuspiciousActivity.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$student',
          count: { $sum: 1 },
          totalRiskScore: { $sum: '$riskScore' },
          avgRiskScore: { $avg: '$riskScore' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate student info
    await Student.populate(topStudents, {
      path: '_id',
      select: 'studentCode fullName class'
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byRiskLevel: byRiskLevel.map(item => ({
          range: `${item._id}-${item._id + 30}`,
          count: item.count
        })),
        byType,
        topStudents: topStudents.map(item => ({
          student: item._id,
          count: item.count,
          totalRiskScore: item.totalRiskScore,
          avgRiskScore: Math.round(item.avgRiskScore)
        }))
      }
    });
  } catch (error) {
    console.error('Get suspicious stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê'
    });
  }
};

/**
 * @desc    Lấy lịch sử suspicious activities của một sinh viên
 * @route   GET /api/admin/suspicious-activities/student/:studentId
 * @access  Private (Admin)
 */
exports.getStudentSuspiciousHistory = async (req, res) => {
  try {
    const activities = await SuspiciousActivity.find({
      student: req.params.studentId
    })
      .populate('event', 'title eventDate startTime location')
      .populate('attendance', 'checkInTime checkInLocation')
      .sort({ detectedAt: -1 });

    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    res.status(200).json({
      success: true,
      count: activities.length,
      student: {
        studentCode: student.studentCode,
        fullName: student.fullName,
        class: student.class
      },
      data: activities
    });
  } catch (error) {
    console.error('Get student suspicious history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử hoạt động đáng ngờ'
    });
  }
};
