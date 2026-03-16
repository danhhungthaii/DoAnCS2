const mongoose = require('mongoose');

/**
 * Notification Schema - Quản lý thông báo
 * @description Schema lưu thông báo cho admin và sinh viên
 */
const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['registration', 'check-in', 'verification', 'system'],
      required: [true, 'Type là bắt buộc'],
    },
    // Người nhận
    recipient: {
      type: String,
      enum: ['admin', 'student', 'all'],
      default: 'admin',
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientModel', // Dynamic reference
    },
    recipientModel: {
      type: String,
      enum: ['User', 'Student'],
    },
    // Nội dung
    title: {
      type: String,
      required: [true, 'Title là bắt buộc'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message là bắt buộc'],
      trim: true,
    },
    // Metadata
    relatedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    relatedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    relatedAttendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
    },
    // Status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Priority
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
