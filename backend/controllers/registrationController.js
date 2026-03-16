const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Student = require('../models/Student');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

/**
 * @desc    Đăng ký tham gia sự kiện
 * @route   POST /api/registrations
 * @access  Private (Student)
 */
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.student?._id || req.user?._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    // Check if event is still open for registration
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    if (eventDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Sự kiện đã diễn ra, không thể đăng ký'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      student: studentId,
      event: eventId,
      status: { $ne: 'cancelled' }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký sự kiện này rồi'
      });
    }

    if (event.maxAttendees !== null && event.registeredCount >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Sự kiện đã đạt tới số lượng tối đa'
      });
    }

    // Create registration
    const registration = await Registration.create({
      student: studentId,
      event: eventId,
      registeredAt: new Date()
    });

    // Increment registered count in Event
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        $or: [
          { maxAttendees: null },
          { $expr: { $lt: ['$registeredCount', '$maxAttendees'] } }
        ]
      },
      {
        $inc: { registeredCount: 1 }
      },
      { new: true }
    );

    if (!updatedEvent) {
      await registration.deleteOne();

      return res.status(400).json({
        success: false,
        message: 'Sự kiện đã đạt tới số lượng tối đa'
      });
    }

    // Populate for response
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('student', 'studentCode fullName class email')
      .populate('event', 'title eventDate startTime location maxAttendees registeredCount points');

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      eventStatus: {
        isFull: updatedEvent.maxAttendees !== null && updatedEvent.registeredCount >= updatedEvent.maxAttendees,
        remainingSlots: updatedEvent.maxAttendees === null
          ? null
          : Math.max(updatedEvent.maxAttendees - updatedEvent.registeredCount, 0)
      },
      data: populatedRegistration
    });
  } catch (error) {
    console.error('Register for event error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký sự kiện này rồi'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký tham gia sự kiện'
    });
  }
};

/**
 * @desc    Lấy danh sách đăng ký của 1 sự kiện (Admin)
 * @route   GET /api/registrations/event/:eventId
 * @access  Private (Admin)
 */
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    const query = { event: eventId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const registrations = await Registration.find(query)
      .populate('student', 'studentCode fullName class email phone')
      .populate('event', 'title eventDate startTime')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Registration.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        registrations,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đăng ký'
    });
  }
};

/**
 * @desc    Lấy danh sách đăng ký của sinh viên hiện tại
 * @route   GET /api/registrations/my-registrations
 * @access  Private (Student)
 */
exports.getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.student?._id || req.user?._id;
    const { status } = req.query;

    const query = { student: studentId };
    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .populate('event', 'title eventDate startTime endTime location points checkInRadius')
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đăng ký'
    });
  }
};

/**
 * @desc    Hủy đăng ký
 * @route   DELETE /api/registrations/:id
 * @access  Private (Student)
 */
exports.cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const studentId = req.student?._id || req.user?._id;

    const registration = await Registration.findOne({
      _id: id,
      student: studentId
    }).populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đăng ký'
      });
    }

    // Check if event has passed
    const now = new Date();
    const eventDate = new Date(registration.event.eventDate);
    if (eventDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Sự kiện đã diễn ra, không thể hủy đăng ký'
      });
    }

    // Update registration status
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    registration.cancelReason = reason || 'Không có lý do';
    await registration.save();

    // Decrement registered count
    await Event.findByIdAndUpdate(registration.event._id, {
      $inc: { registeredCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Đã hủy đăng ký thành công'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đăng ký'
    });
  }
};

/**
 * @desc    Export danh sách đăng ký ra file Excel
 * @route   GET /api/registrations/event/:eventId/export
 * @access  Private (Admin)
 */
exports.exportRegistrationsExcel = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    // Get event info
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    // Get registrations
    const query = { event: eventId };
    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .populate('student', 'studentCode fullName class email phone')
      .sort({ registeredAt: 1 });

    // Prepare data for Excel
    const excelData = registrations.map((reg, index) => ({
      'STT': index + 1,
      'Mã SV': reg.student?.studentCode || '',
      'Họ và tên': reg.student?.fullName || '',
      'Lớp': reg.student?.class || '',
      'Email': reg.student?.email || '',
      'Số điện thoại': reg.student?.phone || '',
      'Ngày đăng ký': new Date(reg.registeredAt).toLocaleString('vi-VN'),
      'Trạng thái': reg.status === 'registered' ? 'Đã đăng ký' : 
                    reg.status === 'attended' ? 'Đã tham dự' : 'Đã hủy',
      'Ghi chú': reg.notes || ''
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // STT
      { wch: 12 }, // Mã SV
      { wch: 25 }, // Họ và tên
      { wch: 12 }, // Lớp
      { wch: 25 }, // Email
      { wch: 15 }, // Số điện thoại
      { wch: 20 }, // Ngày đăng ký
      { wch: 15 }, // Trạng thái
      { wch: 30 }  // Ghi chú
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách đăng ký');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    const filename = `DanhSachDangKy_${event.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất file Excel'
    });
  }
};

/**
 * @desc    Lấy thống kê đăng ký
 * @route   GET /api/registrations/event/:eventId/stats
 * @access  Private (Admin)
 */
exports.getRegistrationStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const stats = await Registration.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      registered: 0,
      cancelled: 0,
      attended: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get registration stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đăng ký'
    });
  }
};
