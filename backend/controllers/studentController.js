const Student = require('../models/Student');

/**
 * @desc    Lấy danh sách sinh viên
 * @route   GET /api/students
 * @access  Private
 */
exports.getAllStudents = async (req, res) => {
  try {
    const { class: className, search, sort = 'studentCode' } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (className) {
      query.class = className;
    }

    if (search) {
      query.$or = [
        { studentCode: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query).sort(sort);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sinh viên',
    });
  }
};

/**
 * @desc    Lấy thông tin 1 sinh viên
 * @route   GET /api/students/:id
 * @access  Private
 */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sinh viên',
    });
  }
};

/**
 * @desc    Thêm sinh viên mới
 * @route   POST /api/students
 * @access  Private
 */
exports.createStudent = async (req, res) => {
  try {
    // Kiểm tra mã sinh viên đã tồn tại
    const existingStudent = await Student.findOne({
      $or: [
        { studentCode: req.body.studentCode },
        { email: req.body.email },
      ],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Mã sinh viên hoặc email đã tồn tại',
      });
    }

    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Thêm sinh viên thành công',
      data: student,
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi thêm sinh viên',
    });
  }
};

/**
 * @desc    Cập nhật sinh viên
 * @route   PUT /api/students/:id
 * @access  Private
 */
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
    }

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật sinh viên thành công',
      data: student,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sinh viên',
    });
  }
};

/**
 * @desc    Xóa sinh viên (soft delete)
 * @route   DELETE /api/students/:id
 * @access  Private
 */
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên',
      });
    }

    // Soft delete
    student.isActive = false;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Xóa sinh viên thành công',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sinh viên',
    });
  }
};
