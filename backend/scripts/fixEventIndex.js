/**
 * Script xóa index qrCode.code trong collection events
 * Chạy: node scripts/fixEventIndex.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const db = mongoose.connection.db;
    const collection = db.collection('events');

    // List tất cả indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Danh sách indexes hiện tại:');
    indexes.forEach(idx => console.log('  -', idx.name));

    // Drop index qrCode.code_1 nếu tồn tại
    try {
      await collection.dropIndex('qrCode.code_1');
      console.log('\n✅ Đã xóa index: qrCode.code_1');
    } catch (err) {
      console.log('\n⚠️  Index qrCode.code_1 không tồn tại hoặc đã bị xóa');
    }

    // Tạo index sparse (cho phép nhiều null)
    await collection.createIndex(
      { 'qrCode.code': 1 },
      { unique: true, sparse: true }
    );
    console.log('✅ Đã tạo index sparse mới: qrCode.code_1 (sparse: true)');

    console.log('\n✅ Hoàn thành! Giờ có thể chạy seedData.js');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

fixIndex();
