const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Student Schema - Quản lý Sinh viên
 * @description Schema cho sinh viên tham gia sự kiện
 */
const studentSchema = new mongoose.Schema(
  {
    studentCode: {
      type: String,
      required: [true, 'Vui lòng nhập mã sinh viên'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên sinh viên'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false, // Không trả về password mặc định khi query
    },
    isFirstLogin: {
      type: Boolean,
      default: true, // Lần đầu login phải đổi mật khẩu
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'],
    },
    class: {
      type: String,
      required: [true, 'Vui lòng nhập lớp'],
      trim: true,
    },
    major: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String, // VD: "2021-2025"
      trim: true,
    },
    deviceId: {
      type: String,
      trim: true,
      sparse: true, // Cho phép null nhưng unique nếu có giá trị
    },
    // Points system
    totalPoints: {
      type: Number,
      default: 0,
      min: [0, 'Tổng điểm không thể âm'],
    },
    pointsHistory: [
      {
        event: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Event',
        },
        points: {
          type: Number,
          required: true,
        },
        earnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index cho tìm kiếm
studentSchema.index({ class: 1 });
studentSchema.index({ fullName: 'text', studentCode: 'text' }); // Text search

/**
 * Hash password trước khi lưu
 */
studentSchema.pre('save', async function (next) {
  // Chỉ hash nếu password được modify
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * So sánh password
 */
studentSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Lỗi khi so sánh mật khẩu');
  }
};

module.exports = mongoose.model('Student', studentSchema);
