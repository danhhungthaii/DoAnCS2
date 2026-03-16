/**
 * Script tạo QR code cho tất cả sự kiện
 * Chạy: node scripts/generateQRCodes.js
 */

const mongoose = require('mongoose');
const Event = require('../models/Event');
const { generateEventQRCode } = require('../utils/qrHelper');
const dotenv = require('dotenv');

dotenv.config();

const generateQRCodes = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Lấy tất cả events chưa có QR code
        const events = await Event.find({
            $or: [
                { 'qrCode.code': { $exists: false } },
                { 'qrCode.code': null },
                { 'qrCode.code': '' }
            ]
        });

        console.log(`\n📱 Tìm thấy ${events.length} sự kiện chưa có QR code\n`);

        let updated = 0;
        for (const event of events) {
            try {
                // Generate QR code cố định (permanent = true, không hết hạn)
                const qrData = await generateEventQRCode(event._id.toString(), true);

                event.qrCode = {
                    code: qrData.code,
                    expiresAt: null, // Không hết hạn
                };

                await event.save();
                console.log(`  ✅ ${event.title}: ${qrData.code}`);
                updated++;
            } catch (err) {
                console.error(`  ❌ Lỗi tạo QR cho "${event.title}":`, err.message);
            }
        }

        // Kiểm tra lại tất cả events
        const allEvents = await Event.find({});
        console.log('\n' + '='.repeat(50));
        console.log('📊 TỔNG KẾT QR CODE');
        console.log('='.repeat(50));

        for (const event of allEvents) {
            const hasQR = event.qrCode?.code ? '✅' : '❌';
            console.log(`${hasQR} ${event.title}`);
            if (event.qrCode?.code) {
                console.log(`   └─ Code: ${event.qrCode.code}`);
            }
        }

        console.log('\n🎉 Hoàn thành! Đã cập nhật QR code cho ' + updated + ' sự kiện');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

generateQRCodes();
