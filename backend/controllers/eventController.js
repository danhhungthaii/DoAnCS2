const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const { generateEventQRCode } = require('../utils/qrHelper');

const normalizeNullableNumber = (value) => {
  if (value === '' || value === undefined || value === null) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? value : parsedValue;
};

const buildEventPayload = (payload) => {
  const eventPayload = { ...payload };

  if (Object.prototype.hasOwnProperty.call(eventPayload, 'maxAttendees')) {
    eventPayload.maxAttendees = normalizeNullableNumber(eventPayload.maxAttendees);
  }

  if (Object.prototype.hasOwnProperty.call(eventPayload, 'points')) {
    eventPayload.points = Number(eventPayload.points);
  }

  return eventPayload;
};

/**
 * @desc    Lấy danh sách tất cả sự kiện
 * @route   GET /api/events
 * @access  Private
 */
exports.getAllEvents = async (req, res) => {
  try {
    const { status, sort = '-eventDate' } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('createdBy', 'username fullName')
      .sort(sort);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sự kiện',
    });
  }
};

/**
 * @desc    Lấy chi tiết 1 sự kiện
 * @route   GET /api/events/:id
 * @access  Private
 */
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username fullName')
      .populate('attendanceCount');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện',
      });
    }

    // Check if logged-in student is registered for this event
    let isRegistered = false;
    if (req.student && req.student._id) {
      const registration = await Registration.findOne({
        event: event._id,
        student: req.student._id,
        status: { $ne: 'cancelled' }
      });
      isRegistered = !!registration;
    }

    // Convert to JSON to trigger toJSON transform (includes dateTime/endDateTime)
    const eventData = event.toJSON();
    eventData.isRegistered = isRegistered;

    res.status(200).json({
      success: true,
      data: eventData,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sự kiện',
    });
  }
};

/**
 * @desc    Tạo sự kiện mới
 * @route   POST /api/events
 * @access  Private
 */
exports.createEvent = async (req, res) => {
  try {
    const eventData = buildEventPayload({
      ...req.body,
      createdBy: req.user._id,
    });

    // Tạo QR code cố định cho sự kiện (không expire)
    const qrData = await generateEventQRCode('temp-id', true);

    const event = await Event.create({
      ...eventData,
      qrCode: {
        code: qrData.code,
        expiresAt: qrData.expiresAt, // null - không hết hạn
      },
    });

    // Cập nhật QR code với eventId thật
    const updatedQR = await generateEventQRCode(event._id.toString(), true);
    event.qrCode.code = updatedQR.code;
    await event.save();

    // Emit real-time event to all connected clients (Android + web)
    const io = req.app.get('io');
    if (io) {
      io.emit('event:new', {
        _id: event._id,
        title: event.title,
        status: event.status,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        bannerUrl: event.bannerUrl,
      });
      console.log(' Emitted event:new for', event.title);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo sự kiện thành công',
      data: event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo sự kiện',
    });
  }
};

/**
 * @desc    Cập nhật sự kiện
 * @route   PUT /api/events/:id
 * @access  Private
 */
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện',
      });
    }

    const updatePayload = buildEventPayload(req.body);

    if (
      updatePayload.maxAttendees !== undefined &&
      updatePayload.maxAttendees !== null &&
      updatePayload.maxAttendees < event.registeredCount
    ) {
      return res.status(400).json({
        success: false,
        message: `Số lượng tối đa không được nhỏ hơn số sinh viên đã đăng ký (${event.registeredCount})`,
      });
    }

    // Update event
    event = await Event.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật sự kiện thành công',
      data: event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sự kiện',
    });
  }
};

/**
 * @desc    Xóa sự kiện
 * @route   DELETE /api/events/:id
 * @access  Private
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện',
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa sự kiện thành công',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sự kiện',
    });
  }
};

/**
 * @desc    Tạo QR code mới cho sự kiện
 * @route   POST /api/events/:id/qr
 * @access  Private
 */
exports.generateQR = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện',
      });
    }

    // Generate new QR code
    const qrData = await generateEventQRCode(event._id.toString());

    event.qrCode = {
      code: qrData.code,
      expiresAt: qrData.expiresAt,
    };

    await event.save();

    // Emit socket event để update QR realtime
    const io = req.app.get('io');
    io.to(`event-${event._id}`).emit('qr-updated', {
      eventId: event._id,
      qrCode: qrData.dataUrl,
      expiresAt: qrData.expiresAt,
    });

    res.status(200).json({
      success: true,
      message: 'Tạo QR code mới thành công',
      data: {
        code: qrData.code,
        dataUrl: qrData.dataUrl,
        expiresAt: qrData.expiresAt,
      },
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo QR code',
    });
  }
};

/**
 * @desc    Đăng ký tham gia sự kiện
 * @route   POST /api/events/:id/register
 * @access  Private (Student)
 */
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện',
      });
    }

    // Kiểm tra xem đã đăng ký chưa
    let existingRegistration = await Registration.findOne({
      event: event._id,
      student: req.student._id,
      status: { $ne: 'cancelled' }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký sự kiện này rồi',
      });
    }

    if (event.maxAttendees !== null && event.registeredCount >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Sự kiện đã đạt tới số lượng tối đa',
      });
    }

    // Tạo bản ghi đăng ký
    const registration = await Registration.create({
      event: event._id,
      student: req.student._id,
      registeredAt: new Date(),
      status: 'registered'
    });

    // Update event registered count
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        $or: [
          { maxAttendees: null },
          { $expr: { $lt: ['$registeredCount', '$maxAttendees'] } },
        ],
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      await registration.deleteOne();

      return res.status(400).json({
        success: false,
        message: 'Sự kiện đã đạt tới số lượng tối đa',
      });
    }

   // Populate thông tin student và event cho response
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('student', 'studentCode fullName class email')
      .populate('event', 'title eventDate startTime location maxAttendees registeredCount points');

    // Socket.IO notification to admin
    const io = req.app.get('io');
    if (io) {
      const student = req.student;
      io.to('admin-room').emit('new-registration', {
        student: {
          studentCode: student.studentCode,
          fullName: student.fullName
        },
        event: {
          _id: event._id,
          title: event.title
        },
        timestamp: new Date()
      });

      if (updatedEvent.maxAttendees !== null && updatedEvent.registeredCount >= updatedEvent.maxAttendees) {
        io.to('admin-room').emit('event-registration-full', {
          eventId: updatedEvent._id,
          title: updatedEvent.title,
          registeredCount: updatedEvent.registeredCount,
          maxAttendees: updatedEvent.maxAttendees,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Đăng ký tham gia thành công',
      eventStatus: {
        isFull: updatedEvent.maxAttendees !== null && updatedEvent.registeredCount >= updatedEvent.maxAttendees,
        remainingSlots: updatedEvent.maxAttendees === null
          ? null
          : Math.max(updatedEvent.maxAttendees - updatedEvent.registeredCount, 0),
      },
      data: populatedRegistration,
    });
  } catch (error) {
    console.error('Register event error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đăng ký sự kiện này rồi'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký sự kiện',
    });
  }
};

/**
 * @desc    Upload banner image cho sự kiện
 * @route   POST /api/events/:id/upload-banner
 * @access  Private
 */
exports.uploadBanner = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh',
      });
    }

    // Construct banner URL
    const bannerUrl = `/uploads/banners/${req.file.filename}`;

    // Update event with banner URL
    event.bannerUrl = bannerUrl;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Upload banner thành công',
      data: {
        bannerUrl,
      },
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload banner',
    });
  }
};

/**
 * @desc    Lấy danh sách địa điểm định sẵn
 * @route   GET /api/events/predefined-locations
 * @access  Public
 */
exports.getPredefinedLocations = (req, res) => {
  const locations = [
    {
      id: 'zone-i',
      name: 'Khu I',
      address: 'Khu I, Ninh Kiều, Cần Thơ',
      coordinates: {
        latitude: 10.0093,
        longitude: 105.7234,
      },
    },
    {
      id: 'library',
      name: 'Thư viện',
      address: 'Thư viện trung tâm, Ninh Kiều, Cần Thơ',
      coordinates: {
        latitude: 10.0082,
        longitude: 105.7234,
      },
    },
    {
      id: 'auditorium-zone-d',
      name: 'Hội trường Khu D',
      address: 'Hội trường Khu D, Ninh Kiều, Cần Thơ',
      coordinates: {
        latitude: 10.007944,
        longitude: 105.7225,
      },
    },
    {
      id: 'auditorium-zone-e',
      name: 'Hội trường Khu E',
      address: 'Hội trường Khu E, Ninh Kiều, Cần Thơ',
      coordinates: {
        latitude: 10.0097,
        longitude: 105.7249,
      },
    },
    {
      id: 'home',
      name: 'Nhà',
      address: 'Nhà',
      coordinates: {
        latitude: 10.006245,
        longitude: 105.742767,
      },
    },
  ];

  res.status(200).json({
    success: true,
    count: locations.length,
    data: locations,
  });
};
