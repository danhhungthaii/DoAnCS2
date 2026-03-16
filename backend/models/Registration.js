const mongoose = require('mongoose');

/**
 * Registration Schema - Đăng ký tham gia sự kiện
 */
const registrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'attended'],
    default: 'registered'
  },
  notes: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index - Mỗi sinh viên chỉ đăng ký 1 lần cho 1 sự kiện
registrationSchema.index({ student: 1, event: 1 }, { unique: true });

// Index for queries
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
