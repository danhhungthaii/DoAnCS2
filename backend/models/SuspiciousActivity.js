const mongoose = require('mongoose');

const suspiciousActivitySchema = new mongoose.Schema({
  // Liên kết với attendance record
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    required: true
  },
  
  // Sinh viên liên quan
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  
  // Sự kiện liên quan
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  // Danh sách các anomaly được phát hiện
  anomalies: [{
    type: {
      type: String,
      enum: [
        'TOO_FAST',           // Điểm danh quá nhanh
        'GPS_TELEPORT',       // Di chuyển quá xa trong thời gian ngắn
        'SHARED_DEVICE',      // Device được share
        'TOO_EARLY',          // Điểm danh quá sớm
        'TOO_LATE',           // Điểm danh quá muộn
        'SUSPICIOUS_PATTERN', // Pattern đáng ngờ
        'LOW_GPS_ACCURACY'    // GPS không chính xác
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    value: {
      type: String
    }
  }],
  
  // Metadata bổ sung
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Điểm rủi ro (0-100)
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Trạng thái xử lý
  status: {
    type: String,
    enum: ['review', 'flagged', 'resolved', 'false_positive'],
    default: 'review'
  },
  
  // Ghi chú của admin
  adminNotes: {
    type: String
  },
  
  // Admin xử lý
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Thời gian xử lý
  reviewedAt: {
    type: Date
  },
  
  // Thời gian phát hiện
  detectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để query nhanh
suspiciousActivitySchema.index({ student: 1, detectedAt: -1 });
suspiciousActivitySchema.index({ event: 1, riskScore: -1 });
suspiciousActivitySchema.index({ status: 1, riskScore: -1 });
suspiciousActivitySchema.index({ detectedAt: -1 });

// Virtual: Lấy tên sinh viên
suspiciousActivitySchema.virtual('studentInfo', {
  ref: 'Student',
  localField: 'student',
  foreignField: '_id',
  justOne: true
});

// Virtual: Lấy thông tin event
suspiciousActivitySchema.virtual('eventInfo', {
  ref: 'Event',
  localField: 'event',
  foreignField: '_id',
  justOne: true
});

const SuspiciousActivity = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);

module.exports = SuspiciousActivity;
