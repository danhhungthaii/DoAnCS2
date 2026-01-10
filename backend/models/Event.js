const mongoose = require('mongoose');

/**
 * Event Schema - Quản lý Sự kiện
 * @description Schema cho sự kiện cần điểm danh
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Vui lòng nhập tên sự kiện'],
      trim: true,
      minlength: [3, 'Tên sự kiện phải có ít nhất 3 ký tự'],
    },
    description: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày diễn ra sự kiện'],
    },
    startTime: {
      type: String, // Format: "HH:mm"
      required: [true, 'Vui lòng nhập giờ bắt đầu'],
    },
    endTime: {
      type: String, // Format: "HH:mm"
      required: [true, 'Vui lòng nhập giờ kết thúc'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Vui lòng nhập địa chỉ sự kiện'],
      },
      coordinates: {
        latitude: {
          type: Number,
          required: [true, 'Vui lòng chọn vị trí trên bản đồ'],
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          required: [true, 'Vui lòng chọn vị trí trên bản đồ'],
          min: -180,
          max: 180,
        },
      },
    },
    checkInRadius: {
      type: Number,
      default: 100, // Bán kính cho phép check-in (mét)
      min: [10, 'Bán kính tối thiểu là 10m'],
      max: [1000, 'Bán kính tối đa là 1000m'],
    },
    qrCode: {
      code: {
        type: String,
        unique: true,
      },
      expiresAt: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    maxAttendees: {
      type: Number,
      default: null, // null = không giới hạn
    },
  },
  {
    timestamps: true,
  }
);

// Index cho tìm kiếm hiệu quả
eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });

// Virtual field: Số lượng sinh viên đã check-in
eventSchema.virtual('attendanceCount', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'event',
  count: true,
});

// Đảm bảo virtuals được serialize
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
