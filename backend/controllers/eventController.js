const Event = require('../models/Event');
const { generateEventQRCode } = require('../utils/qrHelper');

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

    res.status(200).json({
      success: true,
      data: event,
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
    const eventData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // Tạo QR code cho sự kiện
    const qrData = await generateEventQRCode('temp-id');

    const event = await Event.create({
      ...eventData,
      qrCode: {
        code: qrData.code,
        expiresAt: qrData.expiresAt,
      },
    });

    // Cập nhật QR code với eventId thật
    const updatedQR = await generateEventQRCode(event._id.toString());
    event.qrCode.code = updatedQR.code;
    await event.save();

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

    // Update event
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
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
