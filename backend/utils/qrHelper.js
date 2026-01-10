const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate unique QR code for event
 * @param {String} eventId - Event ID
 * @returns {Object} QR code data {code, dataUrl, expiresAt}
 */
const generateEventQRCode = async (eventId) => {
  try {
    // Tạo mã unique kết hợp eventId + timestamp + random
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const uniqueCode = `${eventId}-${timestamp}-${randomString}`;

    // Tạo QR code dạng Data URL
    const qrDataUrl = await QRCode.toDataURL(uniqueCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // QR code hết hạn sau 5 phút
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return {
      code: uniqueCode,
      dataUrl: qrDataUrl,
      expiresAt,
    };
  } catch (error) {
    throw new Error('Lỗi khi tạo mã QR: ' + error.message);
  }
};

/**
 * Verify QR code validity
 * @param {String} code - QR code to verify
 * @param {String} eventId - Event ID
 * @param {Date} expiresAt - Expiration date
 * @returns {Boolean} True if valid
 */
const verifyQRCode = (code, eventId, expiresAt) => {
  // Kiểm tra mã có chứa eventId không
  if (!code.startsWith(eventId)) {
    return false;
  }

  // Kiểm tra hết hạn
  if (new Date() > new Date(expiresAt)) {
    return false;
  }

  return true;
};

module.exports = { generateEventQRCode, verifyQRCode };
