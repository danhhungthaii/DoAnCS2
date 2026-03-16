const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Student = require('../models/Student');
const Registration = require('../models/Registration');
const StudentPoints = require('../models/StudentPoints');
const { calculateDistance, isWithinRadius } = require('../utils/gpsHelper');
const { verifyQRCode } = require('../utils/qrHelper');
const { checkAndLogAnomaly } = require('../utils/anomalyDetection');

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
 * @desc    Lấy danh sách điểm danh hôm nay
 * @route   GET /api/attendances/today
 * @access  Private
 */
exports.getTodayAttendances = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendances = await Attendance.find({
      checkInTime: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('student', 'studentCode fullName class email')
      .populate('event', 'title eventDate startTime endTime')
      .sort({ checkInTime: -1 });

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    console.error('Get today attendances error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách điểm danh hôm nay',
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

    // Enhanced logging for debugging
    console.log('📥 Check-in request received:');
    console.log(`   eventId: ${eventId}`);
    console.log(`   studentId: ${studentId} (type: ${typeof studentId})`);
    console.log(`   qrCode: ${qrCode}`);
    console.log(`   location: ${latitude}, ${longitude}`);

    // Validate required fields
    if (!eventId || !studentId || !qrCode || !latitude || !longitude) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc',
      });
    }

    // ✅ WORKFLOW LAYER 1: Validate QR format (EVENT-{24-char-hex})
    const qrFormatRegex = /^EVENT-[a-f0-9]{24}$/i;
    if (!qrFormatRegex.test(qrCode)) {
      console.log(`❌ Invalid QR format: ${qrCode}`);
      return res.status(400).json({
        success: false,
        message: 'Mã QR không đúng định dạng',
      });
    }

    // ✅ WORKFLOW LAYER 1: Extract event ID from QR and compare
    const qrEventId = qrCode.replace('EVENT-', '');
    if (qrEventId !== eventId.toString()) {
      console.log(`❌ QR event mismatch: QR=${qrEventId}, Param=${eventId}`);
      return res.status(400).json({
        success: false,
        message: 'Mã QR không thuộc sự kiện này',
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

    // ✅ WORKFLOW LAYER 3: Validate event status (must be "ongoing")
    // Use computed status based on real-time, not DB status field
    const computedStatus = event.getComputedStatus();
    if (computedStatus !== 'ongoing') {
      console.log(`❌ Event not ongoing: computedStatus=${computedStatus} (DB status=${event.status})`);
      
      const statusMessages = {
        'upcoming': 'Sự kiện chưa tới giờ bắt đầu',
        'completed': 'Sự kiện đã kết thúc',
        'cancelled': 'Sự kiện đã bị hủy'
      };
      
      return res.status(400).json({
        success: false,
        message: statusMessages[computedStatus] || `Sự kiện không trong thời gian diễn ra (${computedStatus})`,
      });
    }

    // Kiểm tra student tồn tại
    console.log(`🔍 Looking up student with ID: ${studentId}`);
    const student = await Student.findById(studentId);
    if (!student) {
      console.log(`❌ Student not found with ID: ${studentId}`);
      
      // Try to find by studentCode as fallback
      const studentByCode = await Student.findOne({ studentCode: studentId });
      if (studentByCode) {
        console.log(`⚠️  Found student by code instead: ${studentByCode.studentCode} (ID: ${studentByCode._id})`);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
    }
    console.log(`✅ Student found: ${student.studentCode} - ${student.fullName}`);

    // ✅ WORKFLOW LAYER 4: Kiểm tra đã check-in chưa (duplicate prevention)
    const existingAttendance = await Attendance.findOne({
      event: eventId,
      student: studentId,
    });

    if (existingAttendance) {
      console.log(`❌ Duplicate check-in attempt: student=${studentId}, event=${eventId}`);
      return res.status(409).json({
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

    // ✅ WORKFLOW LAYER 5: Reject nếu ngoài vùng cho phép (GPS validation)
    if (!withinRadius) {
      console.log(`❌ Outside radius: distance=${distance}m, allowed=${event.checkInRadius}m`);
      return res.status(403).json({
        success: false,
        message: `Bạn ở ngoài khu vực cho phép (${Math.round(distance)}m). Vui lòng di chuyển đến gần địa điểm sự kiện (trong vòng ${event.checkInRadius}m).`,
        data: {
          distance: Math.round(distance),
          requiredRadius: event.checkInRadius,
          userLocation: { latitude, longitude },
          eventLocation: event.location.coordinates
        }
      });
    }

    // Tạo bản ghi điểm danh (chỉ khi within radius)
    const attendanceData = {
      event: eventId,
      student: studentId,
      checkInLocation: { latitude, longitude },
      distanceFromEvent: distance,
      isValid: true,
      qrCodeUsed: qrCode,
      status: 'present',
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    };

    // Add evidence photo if uploaded
    if (req.file) {
      attendanceData.evidencePhoto = `/uploads/evidence/${req.file.filename}`;
      attendanceData.verificationStatus = 'pending'; // Chờ admin xác minh
      console.log(`📸 Evidence photo uploaded: ${req.file.filename}`);
    } else {
      // Không có ảnh → auto-approve (old behavior)
      attendanceData.verificationStatus = 'approved';
    }

    const attendance = await Attendance.create(attendanceData);

    // Đồng bộ trạng thái đăng ký để danh sách đăng ký hiển thị đúng "Đã điểm danh"
    await Registration.findOneAndUpdate(
      {
        event: eventId,
        student: studentId,
        status: { $ne: 'cancelled' }
      },
      {
        status: 'attended',
        notes: 'Đã điểm danh'
      }
    );

    // Update event attended count
    await Event.updateOne(
      { _id: eventId },
      { $inc: { attendedCount: 1 } }
    );

    // Populate student info
    await attendance.populate('student', 'studentCode fullName class');

   
    const anomalyResult = await checkAndLogAnomaly(
      {
        latitude,
        longitude,
        deviceId: req.body.deviceId,
        locationAccuracy: req.body.locationAccuracy,
        sessionStartTime: req.body.sessionStartTime,
        eventStartTime: event.startTime,
        eventEndTime: event.endTime
      },
      studentId,
      eventId,
      attendance._id
    );

    // Thêm warning vào response nếu phát hiện anomaly
    let warningMessage = null;
    if (anomalyResult && anomalyResult.hasSuspiciousActivity) {
      if (anomalyResult.riskScore >= 70) {
        warningMessage = ' Hệ thống phát hiện hoạt động đáng ngờ. Admin sẽ kiểm tra.';
      }
    }

    // Emit socket event để update realtime
    const io = req.app.get('io');
    if (io) {
      // Event room real-time update
      io.to(`event-${eventId}`).emit('new-check-in', {
        eventId,
        attendance,
        hasAnomaly: anomalyResult?.hasSuspiciousActivity || false,
        riskScore: anomalyResult?.riskScore || 0
      });

      // Admin notification
      io.to('admin-room').emit('new-check-in', {
        student: {
          studentCode: attendance.student.studentCode,
          fullName: attendance.student.fullName
        },
        event: {
          _id: event._id,
          title: event.title
        },
        hasEvidence: !!req.file,
        verificationStatus: attendance.verificationStatus,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: req.file ? 'Điểm danh thành công. Chờ admin xác minh ảnh.' : 'Điểm danh thành công',
      warning: warningMessage,
      data: attendance,
      evidencePhotoUrl: attendanceData.evidencePhoto,
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

/**
 * @desc    Lấy lịch sử điểm danh của sinh viên đang đăng nhập
 * @route   GET /api/attendances/my-history
 * @access  Private (Student)
 */
exports.getMyAttendanceHistory = async (req, res) => {
  try {
    // req.student được set bởi authenticateStudent middleware
    const attendances = await Attendance.find({ student: req.student._id })
      .populate('event', 'title location dateTime endDateTime status')
      .sort({ checkInTime: -1 })
      .limit(100); // Limit to last 100 records

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    console.error('Get my attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử điểm danh',
    });
  }
};

/**
 * @desc    Lấy danh sách điểm danh chờ xác minh
 * @route   GET /api/attendances/pending-verification
 * @access  Private (Admin only)
 */
exports.getPendingVerifications = async (req, res) => {
  try {
    const { eventId, page = 1, limit = 20 } = req.query;
    
    const query = {
      verificationStatus: 'pending',
      evidencePhoto: { $ne: null }
    };
    
    if (eventId) {
      query.event = eventId;
    }
    
    const skip = (page - 1) * limit;
    
    const attendances = await Attendance.find(query)
      .populate('student', 'studentCode fullName class email')
      .populate('event', 'title eventDate startTime points')
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Attendance.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        attendances,
        total,
        pending: total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chờ xác minh'
    });
  }
};

/**
 * @desc    Xác minh điểm danh (approve/reject)
 * @route   PUT /api/attendances/:id/verify
 * @access  Private (Admin only)
 */
exports.verifyAttendance = async (req, res) => {
  try {
    const { verificationStatus, notes } = req.body;
    
    console.log(`📋 Verify attendance request: ID=${req.params.id}, Status=${verificationStatus}`);
    
    // Validate
    if (!['approved', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái xác minh không hợp lệ'
      });
    }
    
    const attendance = await Attendance.findById(req.params.id)
      .populate('event')
      .populate('student');
    
    if (!attendance) {
      console.log(`❌ Attendance not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi điểm danh'
      });
    }
    
    console.log(`✅ Verifying attendance for: ${attendance.student.studentCode} - ${attendance.student.fullName}`);
    console.log(`   Status: ${verificationStatus}, Notes: ${notes || 'N/A'}`);
    
    // Update verification status
    attendance.verificationStatus = verificationStatus;
    attendance.verifiedBy = req.user._id;
    attendance.verifiedAt = new Date();
    attendance.verificationNotes = notes || '';
    
    let pointsAwarded = 0;
    
    // If approved, award points
    if (verificationStatus === 'approved') {
      await Registration.findOneAndUpdate(
        {
          event: attendance.event._id,
          student: attendance.student._id,
          status: { $ne: 'cancelled' }
        },
        {
          status: 'attended',
          notes: 'Đã xác minh điểm danh'
        }
      );

      const event = attendance.event;
      
      // Calculate points
      const basePoints = event.points || 5;
      let bonusPoints = 0;
      
      // Bonus for early check-in (within 10 mins of start)
      const eventStart = new Date(`${event.eventDate.toISOString().split('T')[0]}T${event.startTime}`);
      const checkInTime = new Date(attendance.checkInTime);
      const timeDiff = (eventStart - checkInTime) / (1000 * 60); // minutes
      
      if (timeDiff >= -10 && timeDiff <= 10) {
        bonusPoints += 1; // +1 điểm đến sớm
      }
      
      // Bonus for accurate GPS (within half radius)
      if (attendance.distanceFromEvent < event.checkInRadius / 2) {
        bonusPoints += 0.5; // +0.5 điểm GPS chính xác
      }
      
      pointsAwarded = basePoints + bonusPoints;
      
      // Create StudentPoints record
      try {
        await StudentPoints.create({
          student: attendance.student._id,
          event: event._id,
          points: pointsAwarded,
          basePoints: basePoints,
          bonusPoints: bonusPoints,
          type: 'attendance',
          reason: `Điểm danh ${event.title}`,
          awardedBy: req.user._id,
          earnedAt: attendance.checkInTime
        });
        
        // Update student total points
        await Student.updateOne(
          { _id: attendance.student._id },
          {
            $inc: { totalPoints: pointsAwarded },
            $push: {
              pointsHistory: {
                event: event._id,
                points: pointsAwarded,
                earnedAt: attendance.checkInTime
              }
            }
          }
        );
        
        // Update attendance with points
        attendance.pointsAwarded = pointsAwarded;
        attendance.pointsAwardedAt = new Date();
        
        // Update event verified count
        await Event.updateOne(
          { _id: event._id },
          { $inc: { verifiedCount: 1 } }
        );
        
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key - already awarded points
          console.log('Points already awarded for this attendance');
        } else {
          throw error;
        }
      }
    }

    if (verificationStatus === 'rejected') {
      await Registration.findOneAndUpdate(
        {
          event: attendance.event._id,
          student: attendance.student._id,
          status: 'attended'
        },
        {
          status: 'registered',
          notes: 'Điểm danh bị từ chối xác minh'
        }
      );
    }
    
    await attendance.save();
    
    // Socket.IO notification to student
    const io = req.app.get('io');
    if (io) {
      io.to(`student-${attendance.student._id}`).emit('verification-result', {
        status: verificationStatus,
        pointsAwarded: pointsAwarded,
        event: {
          title: attendance.event.title
        },
        timestamp: new Date()
      });
      
      // Update admin dashboard
      io.to('admin-room').emit('verification-completed', {
        attendanceId: attendance._id,
        status: verificationStatus,
        pointsAwarded: pointsAwarded
      });
    }
    
    res.status(200).json({
      success: true,
      message: verificationStatus === 'approved' 
        ? `Đã xác minh. Cộng ${pointsAwarded} điểm cho sinh viên.`
        : 'Đã từ chối',
      data: {
        attendance,
        pointsAwarded
      }
    });
  } catch (error) {
    console.error('Verify attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác minh điểm danh'
    });
  }
};

/**
 * @desc    Lấy điểm của sinh viên
 * @route   GET /api/attendances/my-points
 * @access  Private (Student)
 */
exports.getMyPoints = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id)
      .select('studentCode fullName totalPoints pointsHistory')
      .populate('pointsHistory.event', 'title eventDate');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }
    
    // Get detailed points history from StudentPoints
    const pointsHistory = await StudentPoints.find({ student: student._id })
      .populate('event', 'title eventDate points')
      .sort({ earnedAt: -1 })
      .limit(50);
    
    // Calculate rank (simple implementation)
    const allStudents = await Student.find({ class: student.class })
      .select('totalPoints')
      .sort({ totalPoints: -1 });
    
    const rank = allStudents.findIndex(s => s._id.toString() === student._id.toString()) + 1;
    const percentile = Math.round((1 - (rank / allStudents.length)) * 100);
    
    res.status(200).json({
      success: true,
      data: {
        totalPoints: student.totalPoints,
        pointsHistory: pointsHistory,
        rank: rank,
        totalStudents: allStudents.length,
        percentile: percentile
      }
    });
  } catch (error) {
    console.error('Get my points error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin điểm'
    });
  }
};

/**
 * @desc    Leaderboard - Bảng xếp hạng
 * @route   GET /api/attendances/leaderboard
 * @access  Public
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { className, limit = 50 } = req.query;
    
    const query = {};
    if (className) {
      query.class = className;
    }
    
    const students = await Student.find(query)
      .select('studentCode fullName class totalPoints')
      .sort({ totalPoints: -1, fullName: 1 })
      .limit(parseInt(limit));
    
    // Add rank to each student
    const leaderboard = students.map((student, index) => ({
      rank: index + 1,
      student: {
        studentCode: student.studentCode,
        fullName: student.fullName,
        class: student.class
      },
      totalPoints: student.totalPoints,
      eventsAttended: 0 // Can be calculated from Attendance if needed
    }));
    
    res.status(200).json({
      success: true,
      data: {
        leaderboard
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy bảng xếp hạng'
    });
  }
};
