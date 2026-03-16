const mongoose = require('mongoose');

/**
 * StudentPoints Schema - Quản lý điểm của sinh viên
 * @description Schema lưu lịch sử điểm tích lũy của sinh viên qua các sự kiện
 */
const studentPointsSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID là bắt buộc'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID là bắt buộc'],
    },
    points: {
      type: Number,
      required: [true, 'Số điểm là bắt buộc'],
      min: [0, 'Số điểm không thể âm'],
    },
    reason: {
      type: String,
      trim: true,
      default: 'Điểm danh sự kiện',
    },
    type: {
      type: String,
      enum: ['attendance', 'bonus', 'penalty', 'manual'],
      default: 'attendance',
    },
    // Breakdown của điểm
    basePoints: {
      type: Number,
      default: 0, // Điểm cơ bản từ sự kiện
    },
    bonusPoints: {
      type: Number,
      default: 0, // Điểm thưởng (đến sớm, GPS chính xác, etc.)
    },
    // Admin xác minh
    awardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: Đảm bảo mỗi sinh viên chỉ nhận điểm 1 lần cho 1 sự kiện
studentPointsSchema.index({ student: 1, event: 1 }, { unique: true });

// Index cho query hiệu quả
studentPointsSchema.index({ student: 1, earnedAt: -1 });
studentPointsSchema.index({ event: 1 });

module.exports = mongoose.model('StudentPoints', studentPointsSchema);
