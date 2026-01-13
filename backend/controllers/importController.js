const XLSX = require('xlsx');
const Student = require('../models/Student');
const fs = require('fs');

/**
 * Import sinh viên từ file Excel
 * POST /api/students/import
 */
exports.importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file Excel'
      });
    }

    // Đọc file Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Chuyển đổi sang JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      // Xóa file sau khi xử lý
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File Excel không có dữ liệu'
      });
    }

    const results = {
      success: [],
      failed: [],
      duplicates: []
    };

    // Xử lý từng dòng
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Map từ tiếng Việt sang field names
        const studentCode = row['Mã sinh viên'] || row['studentCode'];
        const fullName = row['Họ và tên'] || row['fullName'];
        const email = row['Email'] || row['email'];
        const className = row['Lớp'] || row['class'];
        const major = row['Ngành'] || row['major'];
        const phoneNumber = row['Số điện thoại'] || row['phoneNumber'];
        const dateOfBirth = row['Ngày sinh'] || row['dateOfBirth'];
        const deviceId = row['Device ID'] || row['deviceId'];
        
        // Validate dữ liệu bắt buộc
        if (!studentCode || !fullName || !email) {
          results.failed.push({
            row: i + 2, // +2 vì row 1 là header, index bắt đầu từ 0
            data: row,
            error: 'Thiếu thông tin bắt buộc (Mã sinh viên, Họ và tên, Email)'
          });
          continue;
        }

        // Kiểm tra trùng lặp trong DB
        const existing = await Student.findOne({ 
          $or: [
            { studentCode: studentCode },
            { email: email }
          ]
        });

        if (existing) {
          results.duplicates.push({
            row: i + 2,
            studentCode: studentCode,
            reason: existing.studentCode === studentCode 
              ? 'Mã sinh viên đã tồn tại' 
              : 'Email đã tồn tại'
          });
          continue;
        }

        // Tạo sinh viên mới
        const student = await Student.create({
          studentCode: studentCode.toString().trim(),
          fullName: fullName.toString().trim(),
          email: email.toString().trim(),
          class: className ? className.toString().trim() : undefined,
          major: major ? major.toString().trim() : undefined,
          phoneNumber: phoneNumber ? phoneNumber.toString().trim() : undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          deviceId: deviceId ? deviceId.toString().trim() : undefined
        });

        results.success.push({
          row: i + 2,
          studentCode: student.studentCode,
          fullName: student.fullName
        });

      } catch (error) {
        results.failed.push({
          row: i + 2,
          data: row,
          error: error.message
        });
      }
    }

    // Xóa file sau khi xử lý
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Hoàn thành import sinh viên',
      data: {
        total: data.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        duplicateCount: results.duplicates.length,
        details: results
      }
    });

  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi import sinh viên',
      error: error.message
    });
  }
};

/**
 * Download template Excel mẫu
 * GET /api/students/template
 */
exports.downloadTemplate = async (req, res) => {
  try {
    console.log('📥 Downloading template...');
    
    // Tạo dữ liệu mẫu với header rõ ràng
    const templateData = [
      {
        'Mã sinh viên': 'SV001',
        'Họ và tên': 'Nguyễn Văn A',
        'Email': 'sva@student.edu.vn',
        'Lớp': 'CNTT-K44A',
        'Ngành': 'Công nghệ thông tin',
        'Số điện thoại': '0123456789',
        'Ngày sinh': '2002-01-15',
        'Device ID': ''
      },
      {
        'Mã sinh viên': 'SV002',
        'Họ và tên': 'Trần Thị B',
        'Email': 'ttb@student.edu.vn',
        'Lớp': 'CNTT-K44B',
        'Ngành': 'Công nghệ thông tin',
        'Số điện thoại': '0987654321',
        'Ngày sinh': '2002-05-20',
        'Device ID': ''
      },
      {
        'Mã sinh viên': 'SV003',
        'Họ và tên': 'Lê Văn C',
        'Email': 'lvc@student.edu.vn',
        'Lớp': 'KTPM-K44A',
        'Ngành': 'Kỹ thuật phần mềm',
        'Số điện thoại': '0912345678',
        'Ngày sinh': '2002-03-10',
        'Device ID': ''
      }
    ];

    // Tạo workbook và worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachSinhVien');

    // Thiết lập độ rộng cột
    worksheet['!cols'] = [
      { wch: 15 }, // Mã sinh viên
      { wch: 25 }, // Họ và tên
      { wch: 30 }, // Email
      { wch: 15 }, // Lớp
      { wch: 25 }, // Ngành
      { wch: 15 }, // Số điện thoại
      { wch: 15 }, // Ngày sinh
      { wch: 20 }  // Device ID
    ];

    // Tạo buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    console.log('✅ Template created, size:', buffer.length, 'bytes');

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template_students.xlsx"');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } catch (error) {
    console.error('❌ Template download error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo template',
      error: error.message
    });
  }
};

/**
 * Export danh sách sinh viên ra Excel
 * GET /api/students/export
 */
exports.exportStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-__v').lean();

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không có sinh viên nào để export'
      });
    }

    // Format dữ liệu
    const exportData = students.map(student => ({
      'Mã sinh viên': student.studentCode,
      'Họ và tên': student.fullName,
      'Email': student.email,
      'Lớp': student.class || '',
      'Ngành': student.major || '',
      'Số điện thoại': student.phoneNumber || '',
      'Ngày sinh': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '',
      'Device ID': student.deviceId || '',
      'Ngày tạo': new Date(student.createdAt).toLocaleDateString('vi-VN')
    }));

    // Tạo workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Thiết lập độ rộng cột
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }
    ];

    // Tạo buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    const filename = `students_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi export sinh viên',
      error: error.message
    });
  }
};
