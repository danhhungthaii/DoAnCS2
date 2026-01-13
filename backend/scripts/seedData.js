/**
 * Script tạo dữ liệu mẫu cho hệ thống
 * Chạy: node scripts/seedData.js
 */

import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Lấy admin user để làm createdBy
    const adminUser = await User.findOne({ $or: [{ role: 'super_admin' }, { role: 'super-admin' }] });
    if (!adminUser) {
      console.error('❌ Không tìm thấy admin user. Chạy: node scripts/seedAdmin.js trước');
      process.exit(1);
    }
    console.log(`📋 Sử dụng admin: ${adminUser.email}`);

    // Tạo sinh viên mẫu
    const students = [
      {
        studentCode: 'SV001',
        fullName: 'Nguyễn Văn A',
        email: 'sva@student.edu.vn',
        class: 'CNTT-K44A',
        major: 'Công nghệ thông tin',
        deviceId: 'device001'
      },
      {
        studentCode: 'SV002',
        fullName: 'Trần Thị B',
        email: 'ttb@student.edu.vn',
        class: 'CNTT-K44B',
        major: 'Công nghệ thông tin',
        deviceId: 'device002'
      },
      {
        studentCode: 'SV003',
        fullName: 'Lê Văn C',
        email: 'lvc@student.edu.vn',
        class: 'KTPM-K44A',
        major: 'Kỹ thuật phần mềm',
        deviceId: 'device003'
      },
      {
        studentCode: 'SV004',
        fullName: 'Phạm Thị D',
        email: 'ptd@student.edu.vn',
        class: 'KHMT-K44A',
        major: 'Khoa học máy tính',
        deviceId: 'device004'
      },
      {
        studentCode: 'SV005',
        fullName: 'Hoàng Văn E',
        email: 'hve@student.edu.vn',
        class: 'CNTT-K44C',
        major: 'Công nghệ thông tin',
        deviceId: 'device005'
      }
    ];

    console.log('\n📝 Tạo dữ liệu sinh viên...');
    for (const studentData of students) {
      const existing = await Student.findOne({ studentCode: studentData.studentCode });
      if (!existing) {
        await Student.create(studentData);
        console.log(`  ✅ Tạo sinh viên: ${studentData.studentCode} - ${studentData.fullName}`);
      } else {
        console.log(`  ⚠️  Sinh viên đã tồn tại: ${studentData.studentCode}`);
      }
    }

    // Tạo sự kiện mẫu
    const today = new Date();
    const events = [
      {
        title: 'Lễ khai giảng năm học 2024-2025',
        description: 'Lễ khai giảng năm học mới cho tân sinh viên K44',
        eventDate: new Date('2024-09-05'),
        startTime: '08:00',
        endTime: '10:00',
        location: {
          address: 'Hội trường A, Trường Đại học Bách Khoa',
          coordinates: {
            latitude: 10.762622,
            longitude: 106.660172
          }
        },
        checkInRadius: 100,
        status: 'completed',
        createdBy: adminUser._id
      },
      {
        title: 'Hội thảo Trí tuệ nhân tạo 2024',
        description: 'Hội thảo về các xu hướng AI và Machine Learning mới nhất',
        eventDate: new Date('2024-10-15'),
        startTime: '14:00',
        endTime: '17:00',
        location: {
          address: 'Phòng hội thảo B2, Tòa nhà H6',
          coordinates: {
            latitude: 10.763000,
            longitude: 106.661000
          }
        },
        checkInRadius: 50,
        status: 'completed',
        createdBy: adminUser._id
      },
      {
        title: 'Ngày hội việc làm IT 2025',
        description: 'Kết nối sinh viên với các doanh nghiệp công nghệ hàng đầu',
        eventDate: new Date('2025-01-20'),
        startTime: '09:00',
        endTime: '16:00',
        location: {
          address: 'Sân vận động, Campus chính',
          coordinates: {
            latitude: 10.762000,
            longitude: 106.659500
          }
        },
        checkInRadius: 200,
        status: 'upcoming',
        createdBy: adminUser._id
      },
      {
        title: 'Seminar Blockchain & Web3',
        description: 'Khám phá công nghệ Blockchain và ứng dụng thực tế',
        eventDate: today,
        startTime: '09:00',
        endTime: '12:00',
        location: {
          address: 'Phòng Lab C1, Tòa nhà H1',
          coordinates: {
            latitude: 10.762622,
            longitude: 106.660172
          }
        },
        checkInRadius: 100,
        status: 'ongoing',
        createdBy: adminUser._id
      },
      {
        title: 'Workshop DevOps & CI/CD',
        description: 'Thực hành triển khai ứng dụng với Docker, Kubernetes',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: '13:30',
        endTime: '17:30',
        location: {
          address: 'Phòng máy D3, Tòa nhà H2',
          coordinates: {
            latitude: 10.763500,
            longitude: 106.661500
          }
        },
        checkInRadius: 80,
        status: 'upcoming',
        createdBy: adminUser._id
      }
    ];

    console.log('\n📅 Tạo dữ liệu sự kiện...');
    // Xóa events cũ để tránh conflict
    await Event.deleteMany({});
    console.log('  🗑️  Đã xóa sự kiện cũ');
    
    for (const eventData of events) {
      const event = await Event.create(eventData);
      console.log(`  ✅ Tạo sự kiện: ${event.title} (${event.status})`);
    }

    console.log('\n✅ Hoàn thành tạo dữ liệu mẫu!');
    console.log('\n📊 Tổng kết:');
    console.log(`   - Sinh viên: ${await Student.countDocuments()} records`);
    console.log(`   - Sự kiện: ${await Event.countDocuments()} records`);
    console.log('\n🎯 Dùng để test:');
    console.log('   - Web Admin: admin@attendance.com / admin123');
    console.log('   - Android App: SV001, SV002, SV003, SV004, SV005');
    console.log('   - Sự kiện đang diễn ra: "Seminar Blockchain & Web3"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedData();
