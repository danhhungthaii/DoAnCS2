# Hệ thống Điểm danh và Quản lý sự kiện bằng QR Code và GPS

## 📋 Mô tả Đồ án
Hệ thống điểm danh thông minh cho các sự kiện sử dụng công nghệ:
- **QR Code**: Tự động tạo và làm mới mã QR với thời gian hết hạn 5 phút
- **GPS Verification**: Xác minh vị trí sinh viên trong bán kính cho phép
- **Real-time Updates**: Cập nhật điểm danh trực tiếp qua Socket.IO

## 🏗️ Kiến trúc Hệ thống

### Backend
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB Atlas (Mongoose 8.0.3)
- **Authentication**: JWT (7 ngày expiry)
- **Real-time**: Socket.IO 4.6.1
- **Security**: Helmet, bcryptjs

### Frontend
- **Framework**: React 18.3.1 (Vite 7.3.1)
- **UI Library**: Ant Design
- **Styling**: TailwindCSS
- **State Management**: Context API
- **Mapping**: React-Leaflet

## 🚀 Cài đặt

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd DoAnCS2
```

### 2. Setup Backend
```bash
cd backend
npm install
```

**Tạo file .env:**
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://danhhungthao_db_user:DoAnCS2@cluster0.i4nb1ya.mongodb.net/attendance_qr_db

# JWT Secret
JWT_SECRET=attendance_qr_secret_key_2026_change_this_in_production
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Chạy Backend:**
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

**Tạo file .env:**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Chạy Frontend:**
```bash
npm run dev
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Tạo admin mới (chỉ super-admin)
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Events
- `GET /api/events` - Danh sách sự kiện (có filter)
- `POST /api/events` - Tạo sự kiện mới
- `GET /api/events/:id` - Chi tiết sự kiện
- `PUT /api/events/:id` - Cập nhật sự kiện
- `DELETE /api/events/:id` - Xóa sự kiện
- `POST /api/events/:id/qr` - Tạo mã QR mới

### Students
- `GET /api/students` - Danh sách sinh viên (có search)
- `POST /api/students` - Thêm sinh viên
- `GET /api/students/:id` - Chi tiết sinh viên
- `PUT /api/students/:id` - Cập nhật sinh viên
- `DELETE /api/students/:id` - Xóa (soft delete)

### Attendances
- `GET /api/attendances/event/:eventId` - Danh sách điểm danh
- `POST /api/attendances/check-in` - Điểm danh (public)
- `GET /api/attendances/stats/:eventId` - Thống kê

## 🌟 Tính năng Chính

### 1. Quản lý Sự kiện
- ✅ CRUD sự kiện với GPS coordinates
- ✅ Chọn vị trí trên bản đồ Leaflet
- ✅ Thiết lập bán kính cho phép (10-1000m)
- ✅ Trạng thái tự động: upcoming → ongoing → completed

### 2. Quản lý Sinh viên
- ✅ CRUD sinh viên
- ✅ Tìm kiếm theo tên/mã SV
- ✅ Soft delete (isActive flag)
- ✅ Validation mã SV unique

### 3. QR Code Điểm danh
- ✅ Tự động tạo QR code khi tạo sự kiện
- ✅ Generate lại QR mới (hết hạn sau 5 phút)
- ✅ Hiển thị QR lớn 280x280px
- ✅ Socket.IO emit khi QR update

### 4. Real-time Attendance
- ✅ Danh sách điểm danh cập nhật trực tiếp
- ✅ Thống kê: Tổng/Hợp lệ/Ngoài bán kính
- ✅ Màu sắc phân biệt: Xanh (hợp lệ) / Đỏ (không hợp lệ)

### 5. GPS Verification
- ✅ Haversine formula tính khoảng cách chính xác
- ✅ Validate trong bán kính cho phép
- ✅ Lưu vị trí check-in để kiểm tra sau

## 🐛 Troubleshooting

### MongoDB Connection Error
- Kiểm tra IP whitelist trên MongoDB Atlas
- Thêm `0.0.0.0/0` cho môi trường test
- Verify connection string trong .env

### Frontend không kết nối Backend
- Kiểm tra CORS_ORIGIN trong backend/.env
- Verify VITE_API_URL trong frontend/.env
- Đảm bảo backend đang chạy port 5000

### QR Code không hiển thị
- Kiểm tra event có QR code chưa
- Click "Làm mới QR" nếu hết hạn
- Xem Network tab trong DevTools

## 👨‍💻 Tác giả

**Đỗ Danh Hùng Thảo**
- Đề tài: Hệ thống Điểm danh và Quản lý sự kiện bằng QR Code và GPS
- Năm: 2026

---

**Note**: Đây là project đồ án tốt nghiệp. Vui lòng thay đổi JWT_SECRET và MongoDB credentials khi deploy production.
**Chạy Frontend:**
```bash
npm run dev
```

## 👤 Tài khoản Admin Mặc định

Chạy seed script để tạo admin đầu tiên:
```bash
cd backend
node scripts/seedAdmin.js
```

**Thông tin đăng nhập:**
- Username: `admin`
- Password: `admin123`

## Cài đặt

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Các nhánh Git

- `main`: Nhánh chính, code ổn định
- `frontend`: Phát triển frontend
- `backend`: Phát triển backend
- `database`: Thiết kế database schemas
