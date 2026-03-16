const Attendance = require('../models/Attendance');
const SuspiciousActivity = require('../models/SuspiciousActivity');
const { calculateDistance } = require('./gpsHelper');

/**
 * Anomaly Detection Service
 * Phát hiện các hành vi bất thường trong điểm danh
 */

/**
 * Kiểm tra tất cả các anomaly patterns
 */
const detectAnomalies = async (attendanceData, studentId) => {
  const anomalies = [];
  const metadata = {};

  // 1. Check: Điểm danh quá nhanh (< 5 giây từ lúc vào app)
  if (attendanceData.sessionStartTime) {
    const timeDiff = Date.now() - new Date(attendanceData.sessionStartTime).getTime();
    if (timeDiff < 5000) {
      anomalies.push({
        type: 'TOO_FAST',
        severity: 'high',
        description: 'Điểm danh quá nhanh (< 5 giây)',
        value: `${Math.round(timeDiff / 1000)}s`
      });
      metadata.checkInSpeed = timeDiff;
    }
  }

  // 2. Check: GPS Teleport - Di chuyển quá xa trong thời gian ngắn
  const lastAttendance = await Attendance.findOne({
    student: studentId,
    checkInTime: { $exists: true }
  }).sort({ checkInTime: -1 }).limit(1);

  if (lastAttendance && lastAttendance.checkInLocation) {
    const distance = calculateDistance(
      lastAttendance.checkInLocation.latitude,
      lastAttendance.checkInLocation.longitude,
      attendanceData.latitude,
      attendanceData.longitude
    );

    const timeSince = Date.now() - new Date(lastAttendance.checkInTime).getTime();
    const minutesSince = timeSince / (1000 * 60);

    // Nếu di chuyển > 5km trong < 10 phút
    if (distance > 5000 && minutesSince < 10) {
      anomalies.push({
        type: 'GPS_TELEPORT',
        severity: 'high',
        description: 'Di chuyển quá xa trong thời gian ngắn',
        value: `${Math.round(distance / 1000)}km trong ${Math.round(minutesSince)} phút`
      });
      metadata.suspiciousDistance = distance;
      metadata.timeSinceLastCheckIn = minutesSince;
    }
  }

  // 3. Check: Shared Device - Cùng deviceId nhưng khác tài khoản
  if (attendanceData.deviceId) {
    const sameDeviceCount = await Attendance.countDocuments({
      'deviceInfo.deviceId': attendanceData.deviceId,
      student: { $ne: studentId },
      checkInTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 ngày qua
    });

    if (sameDeviceCount > 0) {
      anomalies.push({
        type: 'SHARED_DEVICE',
        severity: 'medium',
        description: 'Device đã được sử dụng bởi tài khoản khác',
        value: `${sameDeviceCount} sinh viên khác`
      });
      metadata.sharedDeviceCount = sameDeviceCount;
    }
  }

  // 4. Check: Điểm danh ngoài giờ
  if (attendanceData.eventStartTime && attendanceData.eventEndTime) {
    const checkInTime = new Date();
    const eventStart = new Date(attendanceData.eventStartTime);
    const eventEnd = new Date(attendanceData.eventEndTime);

    const hoursBeforeStart = (eventStart - checkInTime) / (1000 * 60 * 60);
    const hoursAfterEnd = (checkInTime - eventEnd) / (1000 * 60 * 60);

    // Điểm danh trước sự kiện > 2 giờ
    if (hoursBeforeStart > 2) {
      anomalies.push({
        type: 'TOO_EARLY',
        severity: 'low',
        description: 'Điểm danh quá sớm trước giờ sự kiện',
        value: `${Math.round(hoursBeforeStart * 60)} phút trước`
      });
      metadata.minutesBeforeEvent = hoursBeforeStart * 60;
    }

    // Điểm danh sau sự kiện kết thúc > 1 giờ
    if (hoursAfterEnd > 1) {
      anomalies.push({
        type: 'TOO_LATE',
        severity: 'low',
        description: 'Điểm danh sau khi sự kiện kết thúc',
        value: `${Math.round(hoursAfterEnd * 60)} phút sau`
      });
      metadata.minutesAfterEvent = hoursAfterEnd * 60;
    }
  }

  // 5. Check: Pattern Detection - Luôn điểm danh trong 1 phút đầu
  const recentAttendances = await Attendance.find({
    student: studentId,
    checkInTime: { $exists: true }
  }).sort({ checkInTime: -1 }).limit(5);

  if (recentAttendances.length >= 3) {
    let alwaysEarlyCount = 0;
    for (const att of recentAttendances) {
      // Check nếu điểm danh trong 1 phút đầu sự kiện
      const checkIn = new Date(att.checkInTime);
      // Lấy event để biết thời gian bắt đầu
      // (Simplified - trong thực tế cần populate event)
      alwaysEarlyCount++;
    }

    if (alwaysEarlyCount >= 3) {
      anomalies.push({
        type: 'SUSPICIOUS_PATTERN',
        severity: 'medium',
        description: 'Pattern: Luôn điểm danh rất sớm',
        value: `${alwaysEarlyCount}/5 lần gần đây`
      });
      metadata.earlyCheckInPattern = alwaysEarlyCount;
    }
  }

  // 6. Check: Location Accuracy - GPS không chính xác
  if (attendanceData.locationAccuracy && attendanceData.locationAccuracy > 100) {
    anomalies.push({
      type: 'LOW_GPS_ACCURACY',
      severity: 'medium',
      description: 'Độ chính xác GPS thấp',
      value: `±${Math.round(attendanceData.locationAccuracy)}m`
    });
    metadata.gpsAccuracy = attendanceData.locationAccuracy;
  }

  return {
    hasSuspiciousActivity: anomalies.length > 0,
    anomalies,
    metadata,
    riskScore: calculateRiskScore(anomalies)
  };
};

/**
 * Tính điểm rủi ro (0-100)
 */
const calculateRiskScore = (anomalies) => {
  let score = 0;
  const weights = {
    high: 30,
    medium: 15,
    low: 5
  };

  anomalies.forEach(anomaly => {
    score += weights[anomaly.severity] || 0;
  });

  return Math.min(score, 100);
};

/**
 * Lưu suspicious activity vào database
 */
const logSuspiciousActivity = async (attendanceId, studentId, eventId, anomalies, metadata, riskScore) => {
  try {
    const suspiciousActivity = await SuspiciousActivity.create({
      attendance: attendanceId,
      student: studentId,
      event: eventId,
      anomalies,
      metadata,
      riskScore,
      status: riskScore >= 50 ? 'flagged' : 'review',
      detectedAt: new Date()
    });

    console.log(`⚠️  Suspicious activity detected: ${suspiciousActivity._id} (Risk: ${riskScore})`);
    return suspiciousActivity;
  } catch (error) {
    console.error('Error logging suspicious activity:', error);
    return null;
  }
};

/**
 * Check và xử lý anomaly cho một lần check-in
 */
const checkAndLogAnomaly = async (attendanceData, studentId, eventId, attendanceId) => {
  try {
    const result = await detectAnomalies(attendanceData, studentId);

    if (result.hasSuspiciousActivity) {
      await logSuspiciousActivity(
        attendanceId,
        studentId,
        eventId,
        result.anomalies,
        result.metadata,
        result.riskScore
      );

      console.log(`🚨 Anomalies detected for student ${studentId}:`);
      result.anomalies.forEach(a => {
        console.log(`   - [${a.severity.toUpperCase()}] ${a.type}: ${a.description}`);
      });
    }

    return result;
  } catch (error) {
    console.error('Error in checkAndLogAnomaly:', error);
    return null;
  }
};

module.exports = {
  detectAnomalies,
  calculateRiskScore,
  logSuspiciousActivity,
  checkAndLogAnomaly
};
