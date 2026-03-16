const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * 
 * @param {String} eventId - Event ID
 * @param {Boolean} permanent - Nếu true, tạo mã cố định không expire
 * @returns {Object} QR code data {code, dataUrl, expiresAt}
 */
const generateEventQRCode = async (eventId, permanent = true) => {
  try {
    // Tạo mã cố định chỉ dựa trên eventId 
    const uniqueCode = permanent 
      ? `EVENT-${eventId}` 
      : `${eventId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`; // Mã động

    // Tạo QR code dạng Data URL
    const qrDataUrl = await QRCode.toDataURL(uniqueCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // QR code cố định không hết hạn, hoặc hết hạn sau 5 phút nếu động
    const expiresAt = permanent ? null : new Date(Date.now() + 5 * 60 * 1000);

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
  // Format: EVENT-{eventId} hoặc {eventId}-...
  const expectedCode = `EVENT-${eventId}`;
  if (code !== expectedCode && !code.startsWith(eventId)) {
    return false;
  }

  // Nếu expiresAt là null, QR code không bao giờ hết hạn
  if (expiresAt === null || expiresAt === undefined) {
    return true;
  }

  // Kiểm tra hết hạn nếu có expiresAt
  if (new Date() > new Date(expiresAt)) {
    return false;
  }

  return true;
};

module.exports = { generateEventQRCode, verifyQRCode };
