const User = require('../models/User');
const Student = require('../models/Student');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Đăng ký Admin mới (chỉ super-admin mới được tạo)
 * @route   POST /api/auth/register
 * @access  Private (Super Admin only)
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc tên đăng nhập đã tồn tại',
      });
    }

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || 'admin',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng ký',
    });
  }
};

/**
 * @desc    Đăng nhập Admin
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu',
      });
    }

    // Tìm user và include password
    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
    }

    // Kiểm tra account active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    // Kiểm tra password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
    });
  }
};

/**
 * @desc    Lấy thông tin user hiện tại
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
    });
  }
};

/**
 * @desc    Đăng nhập Sinh viên 
 * @route   POST /api/auth/student-login
 * @access  Public
 */
exports.studentLogin = async (req, res) => {
  try {
    const { studentCode, password, deviceId } = req.body;

    console.log(' Student login attempt:', studentCode);

    // Validate input
    if (!studentCode || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã sinh viên và mật khẩu',
      });
    }

    const normalizedDeviceId = typeof deviceId === 'string' ? deviceId.trim() : '';

    // Tìm sinh viên theo studentCode và include password
    const student = await Student.findOne({ 
      studentCode: studentCode.toUpperCase() 
    }).select('+password');

    if (!student) {
      console.log(` Student not found: ${studentCode}`);
      return res.status(404).json({
        success: false,
        message: 'Mã sinh viên hoặc mật khẩu không đúng',
      });
    }

    console.log(` Student found: ${student.studentCode} - ${student.fullName} (ID: ${student._id})`);

    // Kiểm tra account active
    if (student.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản sinh viên đã bị vô hiệu hóa',
      });
    }

    // Kiểm tra password
    const isPasswordValid = await student.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mã sinh viên hoặc mật khẩu không đúng',
      });
    }

    // Chỉ bắt đầu ràng buộc thiết bị khi app gửi deviceId
    if (normalizedDeviceId) {
      const existingDeviceOwner = await Student.findOne({
        deviceId: normalizedDeviceId,
        _id: { $ne: student._id },
      }).select('studentCode fullName');

      if (existingDeviceOwner) {
        return res.status(403).json({
          success: false,
          message: `Thiết bị này đã được sử dụng bởi tài khoản ${existingDeviceOwner.studentCode}. Vui lòng đăng xuất tài khoản cũ hoặc liên hệ quản trị viên.`,
        });
      }

      // Rule: mỗi sinh viên chỉ đăng nhập bằng thiết bị đã đăng ký
      if (!student.deviceId) {
        student.deviceId = normalizedDeviceId;
        await student.save();
      } else if (student.deviceId !== normalizedDeviceId) {
        return res.status(403).json({
          success: false,
          message: 'Thiết bị không được phép. Vui lòng liên hệ quản trị viên để đổi thiết bị.',
        });
      }
    }

    // Generate token cho student
    const token = generateToken(student._id, 'student');

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      isFirstLogin: student.isFirstLogin, // Quan trọng: App check để chuyển màn đổi mật khẩu
      data: {
        _id: student._id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        class: student.class,
        major: student.major,
        deviceId: student.deviceId,
        isFirstLogin: student.isFirstLogin,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
    });
  }
};

/**
 * @desc    Đổi mật khẩu sinh viên
 * @route   POST /api/auth/change-password
 * @access  Private (Student authenticated)
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
    }

    // Lấy student từ req (đã được set bởi authenticateStudent middleware)
    const studentId = req.student._id;

    // Tìm student và include password
    const student = await Student.findById(studentId).select('+password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
    }

    // Kiểm tra mật khẩu cũ
    const isOldPasswordValid = await student.comparePassword(oldPassword);

    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu cũ không đúng',
      });
    }

    // Cập nhật mật khẩu mới
    student.password = newPassword;
    student.isFirstLogin = false; // Đã đổi mật khẩu rồi
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu',
    });
  }
};
