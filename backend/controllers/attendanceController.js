const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { calculateDistance, isWithinRadius } = require('../utils/gpsHelper');
const { verifyQRCode } = require('../utils/qrHelper');

/**
 * @desc    Lấy danh sách điểm danh theo sự kiện
 * @route   GET /api/attendances/event/:eventId
 * @access  Private
 */
exports.getAttendancesByEvent = async (req, res) => {
  try {
    const attendances = await Attendance.find({ event: req.params.eventId })
      .populate('student', 'studentCode fullName class email')
      .sort({ checkInTime: -1 });

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    console.error('Get attendances error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách điểm danh',
    });
  }
};

/**
 * @desc    Check-in cho sự kiện (từ mobile/web student)
 * @route   POST /api/attendances/check-in
 * @access  Public (có thể thêm auth cho student sau)
 */
exports.checkIn = async (req, res) => {
  try {
    const { eventId, studentId, qrCode, latitude, longitude } = req.body;

    // Validate required fields
    if (!eventId || !studentId || !qrCode || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc',
      });
    }

    // Kiểm tra event tồn tại
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện',
      });
    }

    // Kiểm tra student tồn tại
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
    }

    // Kiểm tra đã check-in chưa
    const existingAttendance = await Attendance.findOne({
      event: eventId,
      student: studentId,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã điểm danh cho sự kiện này rồi',
      });
    }

    // Verify QR code
    const isQRValid = verifyQRCode(
      qrCode,
      eventId,
      event.qrCode.expiresAt
    );

    if (!isQRValid) {
      return res.status(400).json({
        success: false,
        message: 'QR code không hợp lệ hoặc đã hết hạn',
      });
    }

    // Tính khoảng cách GPS
    const distance = calculateDistance(
      event.location.coordinates.latitude,
      event.location.coordinates.longitude,
      latitude,
      longitude
    );

    // Kiểm tra có trong bán kính cho phép không
    const withinRadius = isWithinRadius(
      event.location.coordinates,
      { latitude, longitude },
      event.checkInRadius
    );

    // Tạo bản ghi điểm danh
    const attendance = await Attendance.create({
      event: eventId,
      student: studentId,
      checkInLocation: { latitude, longitude },
      distanceFromEvent: distance,
      isValid: withinRadius,
      qrCodeUsed: qrCode,
      status: withinRadius ? 'present' : 'late',
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    // Populate student info
    await attendance.populate('student', 'studentCode fullName class');

    // Emit socket event để update realtime
    const io = req.app.get('io');
    io.to(`event-${eventId}`).emit('new-check-in', {
      eventId,
      attendance,
    });

    res.status(201).json({
      success: true,
      message: withinRadius
        ? 'Điểm danh thành công'
        : 'Điểm danh thành công nhưng bạn ở ngoài khu vực cho phép',
      data: attendance,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi điểm danh',
    });
  }
};

/**
 * @desc    Thống kê điểm danh theo sự kiện
 * @route   GET /api/attendances/stats/:eventId
 * @access  Private
 */
exports.getAttendanceStats = async (req, res) => {
  try {
    const stats = await Attendance.aggregate([
      { $match: { event: mongoose.Types.ObjectId(req.params.eventId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Attendance.countDocuments({
      event: req.params.eventId,
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        stats,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
    });
  }
};
