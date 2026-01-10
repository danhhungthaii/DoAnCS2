# Backend API - Attendance QR System

## Cấu trúc Thư mục

```
backend/
├── config/           # Cấu hình (database, ...)
├── models/           # MongoDB Schemas
├── routes/           # API Routes
├── controllers/      # Business Logic
├── middleware/       # Middleware (auth, validation, ...)
├── utils/            # Helpers (JWT, QR, GPS, ...)
├── server.js         # Entry point
├── package.json
└── .env.example
```

## Models (Schemas)

### 1. User.js
- Quản lý tài khoản Admin
- Hỗ trợ hash password (bcrypt)
- Method comparePassword để xác thực

### 2. Event.js
- Quản lý sự kiện
- Lưu tọa độ GPS (latitude, longitude)
- Bán kính check-in cho phép
- Trạng thái: upcoming, ongoing, completed, cancelled

### 3. Student.js
- Danh sách sinh viên
- Mã SV, tên, lớp, email, SĐT

### 4. Attendance.js
- Bản ghi điểm danh
- Liên kết Event - Student
- Lưu vị trí GPS khi check-in
- Tính khoảng cách từ vị trí sự kiện

## Utils (Helpers)

### jwt.js
- generateToken(): Tạo JWT token
- verifyToken(): Xác thực token

### gpsHelper.js
- calculateDistance(): Tính khoảng cách giữa 2 điểm GPS (Haversine)
- isWithinRadius(): Kiểm tra có trong bán kính cho phép không

### qrHelper.js
- generateEventQRCode(): Tạo mã QR động (hết hạn sau 5 phút)
- verifyQRCode(): Xác thực mã QR

## Middleware

### auth.js
- authenticate: Xác thực JWT token
- authorizeAdmin: Kiểm tra quyền super-admin

## Cài đặt

```bash
cd backend
npm install
```

## Cấu hình

1. Copy `.env.example` thành `.env`
2. Cập nhật các biến môi trường:
   - MONGODB_URI
   - JWT_SECRET
   - PORT

## Chạy Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints (Sẽ implement tiếp)

### Auth
- POST `/api/auth/register` - Đăng ký admin
- POST `/api/auth/login` - Đăng nhập

### Events
- GET `/api/events` - Lấy danh sách sự kiện
- POST `/api/events` - Tạo sự kiện mới
- GET `/api/events/:id` - Chi tiết sự kiện
- PUT `/api/events/:id` - Cập nhật sự kiện
- DELETE `/api/events/:id` - Xóa sự kiện
- POST `/api/events/:id/qr` - Tạo mã QR mới

### Students
- GET `/api/students` - Danh sách sinh viên
- POST `/api/students` - Thêm sinh viên
- PUT `/api/students/:id` - Cập nhật sinh viên
- DELETE `/api/students/:id` - Xóa sinh viên

### Attendances
- GET `/api/attendances/event/:eventId` - Danh sách điểm danh theo sự kiện
- POST `/api/attendances/check-in` - Check-in (từ mobile)
- GET `/api/attendances/export/:eventId` - Xuất Excel

## Socket.IO Events

### Client → Server
- `join-event`: Join room theo eventId
- `leave-event`: Leave room

### Server → Client
- `new-check-in`: Thông báo có sinh viên mới check-in
- `qr-updated`: QR code được làm mới
