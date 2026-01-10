const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware xác thực JWT token
 * @description Kiểm tra token trong header và xác thực user
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Tìm user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    // Gắn user vào request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

/**
 * Middleware kiểm tra quyền admin
 * @description Chỉ cho phép super-admin thực hiện một số thao tác
 */
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện thao tác này',
    });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
