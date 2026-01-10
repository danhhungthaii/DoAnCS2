const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env
dotenv.config();

/**
 * Seed Admin đầu tiên
 * Chạy: node scripts/seedAdmin.js
 */
const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Kiểm tra đã có admin chưa
    const existingAdmin = await User.findOne({ role: 'super-admin' });

    if (existingAdmin) {
      console.log('⚠️  Super admin đã tồn tại:', existingAdmin.username);
      process.exit(0);
    }

    // Tạo super admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@attendance.com',
      password: 'admin123', // Sẽ tự động hash
      fullName: 'Super Administrator',
      role: 'super-admin',
    });

    console.log('✅ Super admin đã được tạo:');
    console.log('   Username:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   Password: admin123');
    console.log('\n⚠️  Vui lòng đổi mật khẩu sau khi đăng nhập!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
