# Hướng dẫn Phát triển - Hệ thống Điểm danh QR

## 📋 Tổng quan Dự án

**Đề tài:** Hệ thống Điểm danh và Quản lý Sự kiện bằng QR Code và GPS

**Mục tiêu:** Xây dựng hệ thống web cho phép:
- Admin quản lý sự kiện, sinh viên
- Sinh viên check-in bằng QR Code + GPS
- Realtime tracking điểm danh
- Xuất báo cáo Excel

---

## 🛠 Tech Stack

### Backend
- **NodeJS** + **ExpressJS**
- **MongoDB** (Mongoose ODM)
- **Socket.IO** (Real-time)
- **JWT** (Authentication)
- Libraries: bcryptjs, qrcode, express-validator

### Frontend (Admin)
- **ReactJS** (Vite)
- **React Router DOM**
- **Ant Design** + **TailwindCSS**
- **Axios** (HTTP Client)
- **Socket.IO Client**
- **QRCode.react**, **React-Leaflet**

---

## 📁 Cấu trúc Dự án

```
DoAnCS2/
├── backend/              # NodeJS API Server
│   ├── config/          # Database config
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation
│   ├── utils/           # Helpers (JWT, QR, GPS)
│   ├── server.js        # Entry point
│   └── package.json
│
├── frontend/            # React Admin Web
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── layouts/     # Layout components
│   │   ├── services/    # API services
│   │   ├── context/     # React Context
│   │   └── utils/       # Helpers
│   ├── package.json
│   └── vite.config.js
│
└── database/            # Database documentation
    └── README.md        # Schema design
```

---

## 🚀 Hướng dẫn Cài đặt

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd DoAnCS2

# Install Backend
cd backend
npm install

# Install Frontend
cd ../frontend
npm install
```

### 2. Cấu hình MongoDB

**Option 1: Local MongoDB**
```bash
# Install MongoDB Community Server
# Download tại: https://www.mongodb.com/try/download/community

# Start MongoDB service
mongod
```

**Option 2: MongoDB Atlas (Cloud - Recommended)**
1. Tạo account tại: https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí
3. Lấy connection string

### 3. Cấu hình Environment Variables

**Backend (.env)**
```bash
cd backend
cp .env.example .env

# Sửa file .env:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_qr_db
# Hoặc: mongodb+srv://<username>:<password>@cluster.mongodb.net/attendance_qr_db
JWT_SECRET=your_secret_key_here_change_this
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env)**
```bash
cd frontend
cp .env.example .env

# Sửa file .env:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Chạy Ứng dụng

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server chạy tại: http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App chạy tại: http://localhost:5173
```

---

## 📚 Các Nhánh Git

- **main**: Code ổn định, production-ready
- **backend**: Phát triển backend features
- **frontend**: Phát triển frontend features
- **database**: Thiết kế database schema

### Workflow Git

```bash
# Làm việc trên nhánh feature
git checkout backend
# ... code features ...
git add .
git commit -m "feat(backend): Add event CRUD API"

# Merge vào main khi hoàn thành
git checkout main
git merge backend

# Push lên remote
git push origin main
```

---

## 📖 API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký admin mới
- `POST /api/auth/login` - Đăng nhập

### Events
- `GET /api/events` - Danh sách sự kiện
- `POST /api/events` - Tạo sự kiện mới
- `GET /api/events/:id` - Chi tiết sự kiện
- `PUT /api/events/:id` - Cập nhật sự kiện
- `DELETE /api/events/:id` - Xóa sự kiện
- `POST /api/events/:id/qr` - Tạo QR code mới

### Students
- `GET /api/students` - Danh sách sinh viên
- `POST /api/students` - Thêm sinh viên
- `PUT /api/students/:id` - Cập nhật
- `DELETE /api/students/:id` - Xóa

### Attendances
- `GET /api/attendances/event/:eventId` - Danh sách điểm danh
- `POST /api/attendances/check-in` - Check-in
- `GET /api/attendances/export/:eventId` - Xuất Excel

---

## 🔐 Authentication Flow

1. Admin đăng nhập → Nhận JWT token
2. Token lưu trong localStorage
3. Mỗi request API gửi token trong header:
   ```
   Authorization: Bearer <token>
   ```
4. Backend verify token → Cho phép truy cập

---

## 🗺 GPS & QR Code Logic

### GPS Check-in
1. Lấy tọa độ GPS từ thiết bị sinh viên
2. Tính khoảng cách đến sự kiện (Haversine formula)
3. So sánh với bán kính cho phép (checkInRadius)
4. isValid = true nếu trong bán kính

### QR Code
1. Tạo mã unique: `eventId-timestamp-random`
2. Mã hết hạn sau 5 phút
3. Hiển thị QR trên màn hình chiếu
4. Sinh viên scan → Gửi mã + GPS → Check-in

---

## 📡 Real-time Features (Socket.IO)

### Client → Server Events
```javascript
socket.emit('join-event', eventId);
socket.emit('leave-event', eventId);
```

### Server → Client Events
```javascript
socket.on('new-check-in', (data) => {
  // Thêm sinh viên mới vào danh sách
});

socket.on('qr-updated', (qrData) => {
  // Cập nhật QR code mới
});
```

---

## 🎨 Frontend Pages

### 1. LoginPage (`/login`)
- Form đăng nhập
- Validation
- Redirect to dashboard sau khi login

### 2. DashboardPage (`/dashboard`)
- Thống kê tổng quan
- Số lượng sự kiện, sinh viên, điểm danh

### 3. EventsPage (`/events`)
- Danh sách sự kiện (Table)
- CRUD operations
- Modal tạo/sửa sự kiện
- Map picker để chọn vị trí GPS

### 4. StudentsPage (`/students`)
- Danh sách sinh viên (Table)
- CRUD operations
- Import Excel

### 5. QRDisplayPage (`/qr-display/:eventId`)
- Hiển thị QR code lớn
- Danh sách check-in realtime
- Auto refresh QR mỗi 5 phút

---

## 🧪 Testing Workflow

### 1. Test Backend
```bash
# Dùng Postman hoặc Thunder Client
POST http://localhost:5000/api/auth/login
Body: {
  "username": "admin",
  "password": "admin123"
}

# Copy token từ response
# Sử dụng trong các request khác
```

### 2. Test Frontend
1. Mở http://localhost:5173
2. Đăng nhập với account admin
3. Test từng tính năng

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Kiểm tra MongoDB đã chạy chưa
mongosh

# Hoặc kiểm tra service
# Windows: services.msc → MongoDB Server
# Mac: brew services list
```

### CORS Error
- Kiểm tra CORS_ORIGIN trong backend/.env
- Đảm bảo frontend chạy đúng port 5173

### Port đã được sử dụng
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

---

## 📦 Build Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Output: dist/
```

Deploy lên:
- Backend: Heroku, Railway, Render
- Frontend: Vercel, Netlify
- Database: MongoDB Atlas

---

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Setup project structure
- [x] Authentication
- [x] Database schema
- [ ] Event CRUD
- [ ] Student CRUD
- [ ] QR Display

### Phase 2: Advanced Features
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Excel export
- [ ] Statistics & Charts

### Phase 3: Optimization
- [ ] Performance tuning
- [ ] Security hardening
- [ ] Testing (Jest, Cypress)

---

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Kiểm tra console logs (F12)
2. Xem backend terminal output
3. Đọc lại docs
4. Google error message

---

**Happy Coding! 🚀**
