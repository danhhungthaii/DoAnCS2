/**
 * Script tạo lại QR code cho TẤT CẢ sự kiện
 * Dùng khi cần format lại QR codes
 * Chạy: node scripts/regenerate-all-qrcodes.js
 */

const mongoose = require('mongoose');
const Event = require('../models/Event');
const { generateEventQRCode } = require('../utils/qrHelper');
const dotenv = require('dotenv');

dotenv.config();

const regenerateAllQRCodes = async () => {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Lấy TẤT CẢ events
        const events = await Event.find({});

        console.log(`\n📱 Tìm thấy ${events.length} sự kiện\n`);
        console.log('🔄 Đang tạo lại QR code cho tất cả sự kiện...\n');

        let updated = 0;
        for (const event of events) {
            try {
                // Generate QR code cố định (permanent = true, không hết hạn)
                const qrData = await generateEventQRCode(event._id.toString(), true);

                // Log old vs new
                const oldCode = event.qrCode?.code || 'NONE';
                const newCode = qrData.code;
                
                event.qrCode = {
                    code: newCode,
                    expiresAt: null, // Không hết hạn
                };

                await event.save();
                
                const status = oldCode !== newCode ? '🔄 UPDATED' : '✅ OK';
                console.log(`${status} ${event.title}`);
                console.log(`   Old: ${oldCode}`);
                console.log(`   New: ${newCode}\n`);
                
                updated++;
            } catch (err) {
                console.error(`❌ Lỗi tạo QR cho "${event.title}":`, err.message);
            }
        }

        // Kiểm tra lại tất cả events
        const allEvents = await Event.find({});
        console.log('\n' + '='.repeat(60));
        console.log('📊 TỔNG KẾT QR CODE');
        console.log('='.repeat(60));

        for (const event of allEvents) {
            const hasQR = event.qrCode?.code ? '✅' : '❌';
            const isValid = event.qrCode?.code?.startsWith('EVENT-') ? '✓' : '✗';
            console.log(`${hasQR} ${isValid} ${event.title}`);
            if (event.qrCode?.code) {
                console.log(`   └─ Code: ${event.qrCode.code}`);
            }
        }

        console.log('\n🎉 Hoàn thành! Đã cập nhật QR code cho ' + updated + ' sự kiện');
        console.log('📱 Format: EVENT-{eventId}');
        console.log('⏰ Expire: Không (permanent)');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
};

regenerateAllQRCodes();
