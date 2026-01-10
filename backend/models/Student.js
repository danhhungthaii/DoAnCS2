const mongoose = require('mongoose');

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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index cho tìm kiếm
studentSchema.index({ studentCode: 1 });
studentSchema.index({ class: 1 });
studentSchema.index({ fullName: 'text', studentCode: 'text' }); // Text search

module.exports = mongoose.model('Student', studentSchema);
