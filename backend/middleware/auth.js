const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Student = require('../models/Student');

/**
 * Middleware xác thực JWT token cho Admin
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
      message: error.message === 'Token hết hạn'
        ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
        : 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

/**
 * Middleware xác thực JWT token cho Student
 * @description Kiểm tra token student và gắn vào req.student
 */
const authenticateStudent = async (req, res, next) => {
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

    // Kiểm tra token type
    if (decoded.type !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ cho sinh viên',
      });
    }

    // Tìm student
    const student = await Student.findById(decoded.id).select('-password');

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Sinh viên không tồn tại',
      });
    }

    if (student.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    // Gắn student vào request
    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message === 'Token hết hạn'
        ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
        : 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

/**
 * Middleware xác thực JWT token cho cả Admin và Student
 * @description Dùng cho endpoint dùng chung (ví dụ AI chat)
 */
const authenticateAny = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.type === 'student') {
      const student = await Student.findById(decoded.id).select('-password');

      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Sinh viên không tồn tại',
        });
      }

      if (student.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa',
        });
      }

      req.student = student;
      req.actorType = 'student';
      return next();
    }

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

    req.user = user;
    req.actorType = 'admin';
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message === 'Token hết hạn'
        ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
        : 'Token không hợp lệ hoặc đã hết hạn',
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

module.exports = { authenticate, authenticateStudent, authenticateAny, authorizeAdmin };
