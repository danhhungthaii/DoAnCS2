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
      type: String, 
      required: [true, 'Vui lòng nhập giờ bắt đầu'],
    },
    endTime: {
      type: String, 
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
      default: 100, // Bán kính cho phép check-in 
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
      min: [1, 'Số lượng đăng ký tối đa phải lớn hơn 0'],
    },
    bannerUrl: {
      type: String,
      default: null, // URL của banner image cho sự kiện (optional)
    },
    // Points system
    points: {
      type: Number,
      default: 5, // Điểm mặc định cho sự kiện
      min: [0, 'Điểm không thể âm'],
    },
    pointsDescription: {
      type: String,
      trim: true,
      default: 'Điểm thưởng cho việc tham dự sự kiện',
    },
    // Statistics counters
    registeredCount: {
      type: Number,
      default: 0,
    },
    attendedCount: {
      type: Number,
      default: 0,
    },
    verifiedCount: {
      type: Number,
      default: 0,
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

/**
 * Method: Tính trạng thái sự kiện dựa trên thời gian thực
 * @returns {String} 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
 */
eventSchema.methods.getComputedStatus = function() {
  // Nếu đã hủy, giữ nguyên (manual override)
  if (this.status === 'cancelled') {
    return 'cancelled';
  }

  const now = new Date();
  
  // Parse datetime VN (UTC+7) từ eventDate + startTime/endTime
  const dateStr = new Date(this.eventDate).toISOString().split('T')[0];
  
  // Tạo Date object với timezone VN (+07:00)
  const startDateTime = new Date(`${dateStr}T${this.startTime}:00+07:00`);
  const endDateTime = new Date(`${dateStr}T${this.endTime}:00+07:00`);
  
  // So sánh với thời gian hiện tại
  if (now < startDateTime) {
    return 'upcoming';  // Chưa tới giờ bắt đầu
  } else if (now >= startDateTime && now <= endDateTime) {
    return 'ongoing';   // Đang trong thời gian diễn ra
  } else {
    return 'completed'; // Đã kết thúc
  }
};

// Virtual field: Trạng thái computed (real-time)
eventSchema.virtual('computedStatus').get(function() {
  return this.getComputedStatus();
});

eventSchema.virtual('isFull').get(function() {
  if (this.maxAttendees === null || this.maxAttendees === undefined) {
    return false;
  }

  return this.registeredCount >= this.maxAttendees;
});

eventSchema.virtual('remainingSlots').get(function() {
  if (this.maxAttendees === null || this.maxAttendees === undefined) {
    return null;
  }

  return Math.max(this.maxAttendees - this.registeredCount, 0);
});

// Đảm bảo virtuals được serialize + Add dateTime/endDateTime for Android
eventSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Combine eventDate + startTime -> dateTime (ISO format)
    // Convert Vietnam time (UTC+7) to UTC
    if (ret.eventDate && ret.startTime) {
      const dateStr = new Date(ret.eventDate).toISOString().split('T')[0];
      // Parse VN time and convert to UTC
      const [hours, minutes] = ret.startTime.split(':');
      const vnDate = new Date(`${dateStr}T${ret.startTime}:00+07:00`); // VN timezone UTC+7
      ret.dateTime = vnDate.toISOString(); // Convert to UTC
    }
    
    // Combine eventDate + endTime -> endDateTime (ISO format)
    if (ret.eventDate && ret.endTime) {
      const dateStr = new Date(ret.eventDate).toISOString().split('T')[0];
      const vnDate = new Date(`${dateStr}T${ret.endTime}:00+07:00`); // VN timezone UTC+7
      ret.endDateTime = vnDate.toISOString(); // Convert to UTC
    }
    
    // Compute status based on real-time (replace DB status với computed status)
    if (doc.getComputedStatus) {
      const computedStatus = doc.getComputedStatus();
      ret.computedStatus = computedStatus;
      ret.status = computedStatus; // Override status field
    }

    ret.isFull = doc.isFull;
    ret.remainingSlots = doc.remainingSlots;
    
    return ret;
  }
});
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
