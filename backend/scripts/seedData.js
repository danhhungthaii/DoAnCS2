/**
 * Script tạo dữ liệu mẫu cho hệ thống - Đại học Nam Cần Thơ
 * Chạy: node scripts/seedData.js
 */

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Event = require('../models/Event');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Lấy hoặc tạo admin user
    let adminUser = await User.findOne({ role: 'super-admin' });
    if (!adminUser) {
      adminUser = await User.findOne({ role: 'admin' });
    }
    if (!adminUser) {
      console.log('⚠️  Không tìm thấy admin, đang tạo...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@nmc.edu.vn',
        password: hashedPassword,
        fullName: 'Quản trị viên Hệ thống',
        role: 'super-admin',
      });
      console.log('✅ Đã tạo admin: admin@nmc.edu.vn / admin123');
    }
    console.log(`📋 Sử dụng admin: ${adminUser.email}`);

    // ==========================================
    // TẠO SINH VIÊN MẪU - ĐẠI HỌC NAM CẦN THƠ
    // ==========================================
    console.log('\n📝 Tạo dữ liệu sinh viên Đại học Nam Cần Thơ...');

    // Các khoa và ngành học tại Đại học Nam Cần Thơ
    const classes = [
      'CNTT-K48A', 'CNTT-K48B', 'CNTT-K48C', 
      'KTPM-K48A', 'KTPM-K48B',
      'KHMT-K48A',
      'HTTT-K48A', 'HTTT-K48B',
      'KTĐT-K48A', 'KTĐT-K48B',
      'QTKD-K48A', 'QTKD-K48B',
      'KT-K48A', 'KT-K48B',
      'NN-K48A'
    ];
    
    const majors = [
      'Công nghệ thông tin',
      'Kỹ thuật phần mềm', 
      'Khoa học máy tính',
      'Hệ thống thông tin',
      'Kỹ thuật điện tử',
      'Quản trị kinh doanh',
      'Kế toán',
      'Ngôn ngữ Anh'
    ];
    
    // Họ tên phổ biến ở Đồng bằng sông Cửu Long
    const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Võ', 'Phan', 'Lý', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Mai', 'Dương'];
    const middleNames = ['Văn', 'Thị', 'Hoàng', 'Minh', 'Quốc', 'Thanh', 'Đức', 'Hữu', 'Ngọc', 'Thành', 'Anh', 'Kim'];
    const lastNames = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Linh', 'Minh', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Vinh', 'Xuân', 'Yến', 'Thảo', 'Huy'];

    // Xóa sinh viên cũ
    await Student.deleteMany({});
    console.log('  🗑️  Đã xóa dữ liệu cũ');

    // Hash password cho students vì insertMany không trigger pre-save hook
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const students = [];
    for (let i = 1; i <= 320; i++) {
      const studentCode = `SV${i.toString().padStart(3, '0')}`; // Mã sinh viên: SV001-SV320
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${middleName} ${lastName}`;
      const classItem = classes[Math.floor(Math.random() * classes.length)];
      const major = majors[Math.floor(Math.random() * majors.length)];
      
      // Generate random phone number
      const phonePrefix = ['090', '091', '092', '093', '094', '096', '097', '098', '099'];
      const randomPrefix = phonePrefix[Math.floor(Math.random() * phonePrefix.length)];
      const phoneNumber = `${randomPrefix}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;

      students.push({
        studentCode,
        fullName,
        email: `${studentCode}@sv.nmc.edu.vn`,
        password: hashedPassword,
        phone: phoneNumber,
        class: classItem,
        major,
        academicYear: '2020-2024',
        deviceId: null,
      });
    }

    await Student.insertMany(students);
    console.log(`  ✅ Đã tạo ${students.length} sinh viên (password: 123456)`);

    // ==========================================
    // TẠO SỰ KIỆN MẪU (15 sự kiện)
    // ==========================================
    // TẠO SỰ KIỆN MẪU - ĐẠI HỌC NAM CẦN THƠ
    // ==========================================
    console.log('\n📅 Tạo dữ liệu sự kiện...');

    await Event.deleteMany({});
    console.log('  🗑️  Đã xóa sự kiện cũ');

    const today = new Date();
    const events = [
      // Sự kiện đã hoàn thành (5)
      {
        title: 'Lễ khai giảng năm học 2024-2025',
        description: 'Lễ khai giảng năm học mới cho tân sinh viên K48',
        eventDate: new Date('2024-09-05'),
        startTime: '08:00', endTime: '10:00',
        location: { address: 'Hội trường Khu E, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0097, longitude: 105.7249 } },
        checkInRadius: 150, status: 'completed', createdBy: adminUser._id
      },
      {
        title: 'Hội thảo Trí tuệ nhân tạo 2024',
        description: 'Hội thảo về xu hướng AI và Machine Learning trong nông nghiệp',
        eventDate: new Date('2024-10-15'),
        startTime: '14:00', endTime: '17:00',
        location: { address: 'Hội trường Khu D, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.007944, longitude: 105.7225 } },
        checkInRadius: 100, status: 'completed', createdBy: adminUser._id
      },
      {
        title: 'Workshop Python cơ bản',
        description: 'Hướng dẫn lập trình Python cho sinh viên mới',
        eventDate: new Date('2024-11-10'),
        startTime: '09:00', endTime: '12:00',
        location: { address: 'Khu I, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0093, longitude: 105.7234 } },
        checkInRadius: 80, status: 'completed', createdBy: adminUser._id
      },
      {
        title: 'Seminar Blockchain & Công nghệ số',
        description: 'Khám phá công nghệ Blockchain và ứng dụng trong ĐBSCL',
        eventDate: new Date('2024-12-05'),
        startTime: '13:30', endTime: '16:30',
        location: { address: 'Thư viện trung tâm, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0082, longitude: 105.7234 } },
        checkInRadius: 60, status: 'completed', createdBy: adminUser._id
      },
      {
        title: 'Cuộc thi lập trình ACM 2024',
        description: 'Cuộc thi lập trình thuật toán cấp trường',
        eventDate: new Date('2024-12-20'),
        startTime: '08:00', endTime: '14:00',
        location: { address: 'Khu I, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0093, longitude: 105.7234 } },
        checkInRadius: 100, status: 'completed', createdBy: adminUser._id
      },
      // Sự kiện đang diễn ra (2)
      {
        title: 'Workshop DevOps & CI/CD',
        description: 'Thực hành Docker, Kubernetes, Jenkins cho sinh viên IT',
        eventDate: today,
        startTime: '09:00', endTime: '17:00',
        location: { address: 'Khu I, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0093, longitude: 105.7234 } },
        checkInRadius: 80, status: 'ongoing', createdBy: adminUser._id
      },
      {
        title: 'Hội nghị khoa học sinh viên 2026',
        description: 'Báo cáo các đề tài nghiên cứu khoa học của sinh viên',
        eventDate: today,
        startTime: '08:00', endTime: '18:00',
        location: { address: 'Hội trường Khu E, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0097, longitude: 105.7249 } },
        checkInRadius: 150, status: 'ongoing', createdBy: adminUser._id
      },
      {
        title: 'Test Event - Nhà',
        description: 'Sự kiện test tại nhà để thử nghiệm tính năng điểm danh',
        eventDate: today,
        startTime: '00:00', endTime: '23:59',
        location: { address: 'Nhà', coordinates: { latitude: 10.006245, longitude: 105.742767 } },
        checkInRadius: 100, status: 'ongoing', createdBy: adminUser._id
      },
      // Sự kiện sắp tới (8)
      {
        title: 'Ngày hội việc làm IT 2026',
        description: 'Kết nối sinh viên với doanh nghiệp công nghệ',
        eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        startTime: '09:00', endTime: '16:00',
        location: { address: 'Hội trường Khu E, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0097, longitude: 105.7249 } },
        checkInRadius: 150, status: 'upcoming', createdBy: adminUser._id
      },
      {
        title: 'Seminar Cloud Computing',
        description: 'AWS, Azure, Google Cloud Platform và ứng dụng thực tế',
        eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        startTime: '14:00', endTime: '17:00',
        location: { address: 'Hội trường Khu D, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.007944, longitude: 105.7225 } },
        checkInRadius: 100, status: 'upcoming', createdBy: adminUser._id
      },
      {
        title: 'Workshop Mobile App Development',
        description: 'Phát triển ứng dụng React Native từ A-Z',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: '09:00', endTime: '12:00',
        location: { address: 'Khu I, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0093, longitude: 105.7234 } },
        checkInRadius: 80, status: 'upcoming', createdBy: adminUser._id
      },
      {
        title: 'Hackathon Innovation 2026',
        description: 'Cuộc thi hackathon 24h - Giải pháp cho ĐBSCL',
        eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        startTime: '18:00', endTime: '18:00',
        location: { address: 'Khu I, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0093, longitude: 105.7234 } },
        checkInRadius: 100, status: 'upcoming', createdBy: adminUser._id
      },
      {
        title: 'Talkshow: Hành trình khởi nghiệp',
        description: 'Chia sẻ từ các founder startup thành công tại Cần Thơ',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        startTime: '19:00', endTime: '21:00',
        location: { address: 'Hội trường Khu D, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.007944, longitude: 105.7225 } },
        checkInRadius: 100, status: 'upcoming', createdBy: adminUser._id
      },
      {
        title: 'Workshop UI/UX Design',
        description: 'Thiết kế giao diện người dùng với Figma',
        eventDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        startTime: '14:00', endTime: '17:00',
        location: { address: 'Thư viện trung tâm, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0082, longitude: 105.7234 } },
        checkInRadius: 60, status: 'upcoming', createdBy: adminUser._id
      },
      {
        title: 'Career Day - Định hướng nghề nghiệp',
        description: 'Hướng dẫn viết CV và kỹ năng phỏng vấn',
        eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        startTime: '09:00', endTime: '12:00',
        location: { address: 'Hội trường Khu D, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.007944, longitude: 105.7225 } },
        checkInRadius: 100, status: 'upcoming', createdBy: adminUser._id
      },
      {
        title: 'Lễ tốt nghiệp K44',
        description: 'Lễ trao bằng tốt nghiệp khóa 44',
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: '08:00', endTime: '11:00',
        location: { address: 'Hội trường Khu E, Ninh Kiều, Cần Thơ', coordinates: { latitude: 10.0097, longitude: 105.7249 } },
        checkInRadius: 150, status: 'upcoming', createdBy: adminUser._id
      },
    ];

    const createdEvents = await Event.insertMany(events);
    console.log(`  ✅ Đã tạo ${createdEvents.length} sự kiện`);

    // ==========================================
    // TẠO ĐIỂM DANH MẪU (87 điểm danh hôm nay)
    // ==========================================
    console.log('\n✅ Tạo dữ liệu điểm danh...');

    await Attendance.deleteMany({});
    console.log('  🗑️  Đã xóa điểm danh cũ');

    // Lấy sự kiện đang diễn ra
    const ongoingEvents = createdEvents.filter(e => e.status === 'ongoing');
    const allStudents = await Student.find({});

    const attendances = [];
    let todayCount = 0;

    for (const event of ongoingEvents) {
      // Random 40-50 sinh viên điểm danh cho mỗi sự kiện ongoing
      const attendeeCount = Math.floor(Math.random() * 11) + 40;
      const shuffled = allStudents.sort(() => 0.5 - Math.random());
      const attendees = shuffled.slice(0, attendeeCount);

      for (const student of attendees) {
        const checkInTime = new Date(today);
        checkInTime.setHours(8 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0);

        attendances.push({
          event: event._id,
          student: student._id,
          checkInTime,
          status: 'present',
          checkInLocation: {
            latitude: event.location.coordinates.latitude + (Math.random() - 0.5) * 0.001,
            longitude: event.location.coordinates.longitude + (Math.random() - 0.5) * 0.001,
          },
          deviceInfo: {
            userAgent: `${Math.random() > 0.3 ? 'Android' : 'iOS'} App v1.0`,
          },
        });
        todayCount++;
      }
    }

    // Thêm điểm danh cho các sự kiện đã hoàn thành
    const completedEvents = createdEvents.filter(e => e.status === 'completed');
    for (const event of completedEvents) {
      const attendeeCount = Math.floor(Math.random() * 50) + 30;
      const shuffled = allStudents.sort(() => 0.5 - Math.random());
      const attendees = shuffled.slice(0, attendeeCount);

      for (const student of attendees) {
        const checkInTime = new Date(event.eventDate);
        checkInTime.setHours(8 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0);

        attendances.push({
          event: event._id,
          student: student._id,
          checkInTime,
          status: 'present',
          checkInLocation: {
            latitude: event.location.coordinates.latitude + (Math.random() - 0.5) * 0.001,
            longitude: event.location.coordinates.longitude + (Math.random() - 0.5) * 0.001,
          },
          deviceInfo: {
            userAgent: `${Math.random() > 0.3 ? 'Android' : 'iOS'} App v1.0`,
          },
        });
      }
    }

    await Attendance.insertMany(attendances);
    console.log(`  ✅ Đã tạo ${attendances.length} bản ghi điểm danh`);
    console.log(`  📊 Điểm danh hôm nay: ${todayCount}`);

    // ==========================================
    // TỔNG KẾT
    // ==========================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 HOÀN THÀNH TẠO DỮ LIỆU MẪU!');
    console.log('='.repeat(50));
    console.log('\n📊 Tổng kết:');
    console.log(`   📋 Sự kiện: ${await Event.countDocuments()} (${completedEvents.length} completed, ${ongoingEvents.length} ongoing, ${events.length - completedEvents.length - ongoingEvents.length} upcoming)`);
    console.log(`   👨‍🎓 Sinh viên: ${await Student.countDocuments()}`);
    console.log(`   ✅ Điểm danh hôm nay: ${todayCount}`);
    console.log(`   📁 Tổng điểm danh: ${await Attendance.countDocuments()}`);
    console.log('\n🔑 Thông tin đăng nhập:');
    console.log(`   Web Admin: ${adminUser.email} / admin123`);
    console.log('   App SV: SV001 / 123456 (hoặc SV002-SV320)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedData();
