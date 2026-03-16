const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

async function createTestStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Xóa student test nếu đã tồn tại
    await Student.deleteOne({ studentCode: 'SV001' });

    // Tạo student mới với password
    const student = await Student.create({
      studentCode: 'SV001',
      fullName: 'Nguyễn Văn A',
      email: 'sva@student.edu.vn',
      password: '123456', // Sẽ tự động hash
      class: 'CNTT-K44A',
      major: 'Công nghệ thông tin',
      phone: '0123456789',
      isFirstLogin: true
    });

    console.log('✅ Tạo student thành công:');
    console.log('   MSSV:', student.studentCode);
    console.log('   Tên:', student.fullName);
    console.log('   Password: 123456');
    console.log('   Email:', student.email);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

createTestStudent();
