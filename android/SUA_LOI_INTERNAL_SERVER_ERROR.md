# 🚨 SỬA LỖI: INTERNAL SERVER ERROR KHI ĐĂNG NHẬP

## ❌ TÌNH TRẠNG

Khi bấm đăng nhập trên Android app, nhận lỗi:
```
Internal Server Error (500)
```

## ✅ NGUYÊN NHÂN

Backend trả về **500 Internal Server Error** - Có lỗi trong code backend khi xử lý login request.

**Test đã xác nhận:**
- ✅ Backend ĐANG CHẠY trên port 5000
- ✅ Android app KẾT NỐI được với backend  
- ❌ Backend BỊ LỖI khi xử lý `/api/auth/student-login`

---

## 🔍 DEBUG BACKEND

### Bước 1: Xem Logs Backend

Mở terminal nơi backend đang chạy và xem logs:

```
Backend sẽ hiển thị error stack trace ở đây
```

**Các lỗi thường gặp:**

1. **"Student is not defined"** hoặc **"User is not defined"**
   - Chưa import model Student/User
   
2. **"Cannot find module 'bcrypt'"**
   - Chưa cài bcrypt: `npm install bcrypt`
   
3. **"MongoServerError: connect ECONNREFUSED"**
   - MongoDB chưa chạy
   
4. **"isFirstLogin is not defined"**
   - Schema thiếu field isFirstLogin

5. **"comparePassword is not a function"**
   - Model chưa có method comparePassword

---

## ✅ GIẢI PHÁP NHANH

### Cách 1: Kiểm Tra Logs Backend

1. Xem terminal đang chạy backend
2. Scroll lên tìm dòng ERROR màu đỏ
3. Copy error message
4. Sửa theo hướng dẫn bên dưới

### Cách 2: Restart Backend Với Logs Chi Tiết

```bash
cd C:\path\to\backend
npm start
```

Hoặc nếu dùng nodemon:
```bash
npm run dev
```

---

## 🛠️ SỬA CÁC LỖI THƯỜNG GẶP

### LỖI 1: Chưa Có Model Student

**Lỗi:**
```
ReferenceError: Student is not defined
```

**Giải pháp:**

Tạo file `models/Student.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
    studentCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: String,
    phone: String,
    class: String,
    major: String,
    password: {
        type: String,
        required: true
    },
    deviceId: String,
    isFirstLogin: {
        type: Boolean,
        default: true
    }
});

// Hash password trước khi save
studentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method để verify password
studentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
```

Trong file route, import:
```javascript
const Student = require('../models/Student');
```

---

### LỖI 2: Chưa Cài Bcrypt

**Lỗi:**
```
Error: Cannot find module 'bcrypt'
```

**Giải pháp:**
```bash
npm install bcrypt
```

---

### LỖI 3: MongoDB Chưa Chạy

**Lỗi:**
```
MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```

**Giải pháp:**

**Windows:**
```bash
# Start MongoDB service
net start MongoDB
```

**Mac/Linux:**
```bash
sudo service mongod start
```

Hoặc dùng MongoDB Atlas (cloud):
```javascript
// Trong file server.js
mongoose.connect('mongodb+srv://username:password@cluster.mongodb.net/attendance')
```

---

### LỖI 4: Endpoint Chưa Được Implement Đúng

**Kiểm tra file route `routes/auth.js`:**

```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// POST /api/auth/student-login
router.post('/student-login', async (req, res) => {
    try {
        const { studentCode, password, deviceId } = req.body;

        // Validate
        if (!studentCode || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã sinh viên và mật khẩu'
            });
        }

        // Tìm student
        const student = await Student.findOne({ 
            studentCode: studentCode.toUpperCase() 
        });

        if (!student) {
            return res.status(401).json({
                success: false,
                message: 'Mã sinh viên hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra password
        const isPasswordValid = await student.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mã sinh viên hoặc mật khẩu không đúng'
            });
        }

        // Update deviceId
        if (deviceId) {
            student.deviceId = deviceId;
            await student.save();
        }

        // Tạo JWT token
        const token = jwt.sign(
            { 
                id: student._id, 
                studentCode: student.studentCode 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        // Return response
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            isFirstLogin: student.isFirstLogin,
            data: {
                _id: student._id,
                studentCode: student.studentCode,
                fullName: student.fullName,
                email: student.email,
                phone: student.phone,
                class: student.class,
                major: student.major,
                deviceId: student.deviceId
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
```

---

### LỖI 5: Route Chưa Được Đăng Ký

**Kiểm tra file `server.js` hoặc `app.js`:**

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - QUAN TRỌNG!
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);  // ← Phải có dòng này!

// MongoDB
mongoose.connect('mongodb://localhost:27017/attendance')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## 🧪 TEST LẠI SAU KHI SỬA

### 1. Tạo Student Test

Chạy script này để tạo student test:

```javascript
// scripts/createTestStudent.js
const mongoose = require('mongoose');
const Student = require('../models/Student');

mongoose.connect('mongodb://localhost:27017/attendance');

async function createTestStudent() {
    try {
        // Xóa student cũ nếu có
        await Student.deleteOne({ studentCode: 'SV001' });
        
        // Tạo mới
        const student = new Student({
            studentCode: 'SV001',
            fullName: 'Nguyễn Văn A',
            email: 'sv001@student.edu.vn',
            phone: '0123456789',
            class: 'CNTT01',
            major: 'Công nghệ thông tin',
            password: '123456',  // Sẽ được hash tự động
            isFirstLogin: true
        });
        
        await student.save();
        console.log('✅ Created test student SV001');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestStudent();
```

Chạy:
```bash
node scripts/createTestStudent.js
```

### 2. Test Login Bằng curl

```bash
curl -X POST http://localhost:5000/api/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"studentCode":"SV001","password":"123456","deviceId":"test"}'
```

Hoặc PowerShell:
```powershell
$body = @{
    studentCode = "SV001"
    password = "123456"
    deviceId = "test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/student-login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "token": "eyJhbGc...",
  "isFirstLogin": true,
  "data": {
    "_id": "...",
    "studentCode": "SV001",
    "fullName": "Nguyễn Văn A",
    ...
  }
}
```

### 3. Test Trên Android App

```bash
# Install app
adb install app/build/outputs/apk/debug/app-debug.apk

# Watch logs
adb logcat | Select-String "MainActivity|RetrofitClient"
```

**Login:**
- MSSV: SV001
- Password: 123456

**Expected:** Đăng nhập thành công → Chuyển sang Change Password

---

## 📋 CHECKLIST SỬA LỖI

- [ ] Đã xem logs backend tìm error message
- [ ] Đã có file `models/Student.js` với schema đúng
- [ ] Đã cài bcrypt: `npm install bcrypt`
- [ ] MongoDB đang chạy
- [ ] Đã có file `routes/auth.js` với endpoint student-login
- [ ] Đã đăng ký route trong `server.js`: `app.use('/api/auth', authRoutes)`
- [ ] Đã tạo student test trong database
- [ ] Test login bằng curl/PowerShell thành công
- [ ] Test login trên Android app thành công

---

## 🆘 NẾU VẪN LỖI

1. **Copy toàn bộ error message từ backend logs**
2. **Paste vào đây để tôi debug tiếp**

Hoặc check:
- [ ] File `BACKEND_API_IMPLEMENTATION.md` - Code mẫu đầy đủ
- [ ] Backend có dependencies đủ không: `npm install express mongoose bcrypt jsonwebtoken cors`
- [ ] Port 5000 có bị chiếm không: Thử port khác

---

**TÓM TẮT:**

✅ Android app KHÔNG CÓ LỖI  
❌ Backend CÓ LỖI → Cần sửa backend  
📖 Xem logs backend để biết lỗi cụ thể  
🛠️ Follow hướng dẫn trên để sửa

**SAU KHI SỬA BACKEND → APP SẼ HOẠT ĐỘNG NGAY!** 🚀

