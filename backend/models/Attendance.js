const mongoose = require('mongoose');

/**
 * Attendance Schema - Bản ghi Điểm danh
 * @description Schema lưu thông tin điểm danh của sinh viên cho sự kiện
 */
const attendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID là bắt buộc'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID là bắt buộc'],
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkInLocation: {
      latitude: {
        type: Number,
        required: [true, 'Vui lòng cung cấp tọa độ GPS'],
      },
      longitude: {
        type: Number,
        required: [true, 'Vui lòng cung cấp tọa độ GPS'],
      },
    },
    distanceFromEvent: {
      type: Number, // Khoảng cách từ vị trí check-in đến vị trí sự kiện (mét)
    },
    isValid: {
      type: Boolean,
      default: true, // True nếu check-in trong bán kính cho phép
    },
    qrCodeUsed: {
      type: String, // Mã QR đã sử dụng để check-in
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
    },
    status: {
      type: String,
      enum: ['registered', 'present', 'late', 'absent'],
      default: 'present', // Default là present khi check-in, sẽ là registered khi đăng ký
    },
    // Registration info
    registeredAt: {
      type: Date,
    },
    // Evidence & Verification
    evidencePhoto: {
      type: String, // Path to uploaded photo
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who verified
    },
    verifiedAt: {
      type: Date,
    },
    verificationNotes: {
      type: String,
      trim: true,
    },
    // Points awarded
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    pointsAwardedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: Đảm bảo mỗi sinh viên chỉ check-in 1 lần cho 1 sự kiện
attendanceSchema.index({ event: 1, student: 1 }, { unique: true });

// Index cho query hiệu quả
attendanceSchema.index({ event: 1, checkInTime: -1 });
attendanceSchema.index({ student: 1 });

// Virtual: Tính trạng thái dựa trên thời gian check-in
attendanceSchema.virtual('attendanceStatus').get(function () {
  // Logic có thể mở rộng: so sánh checkInTime với thời gian sự kiện
  return this.status;
});

attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
