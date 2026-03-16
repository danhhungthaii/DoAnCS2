# Hệ thống quản lý sinh viên và điểm danh sự kiện

## Giới thiệu

Đây là đồ án xây dựng hệ thống quản lý sự kiện và điểm danh sinh viên bằng QR Code, GPS và cập nhật thời gian thực. Dự án gồm ba phần chính:

- Backend API bằng Node.js, Express và MongoDB
- Frontend quản trị bằng React, Vite và Ant Design
- Ứng dụng Android cho sinh viên

Hệ thống hỗ trợ các nghiệp vụ chính sau:

- Quản lý tài khoản quản trị viên và sinh viên
- Tạo, cập nhật và theo dõi sự kiện
- Sinh QR code cho điểm danh
- Kiểm tra vị trí GPS khi điểm danh
- Import và export danh sách sinh viên bằng Excel
- Theo dõi điểm, lịch sử tham gia và bảng xếp hạng
- Cập nhật dữ liệu thời gian thực qua Socket.IO

## Kiến trúc thư mục

```text
DoAnCS2/
├─ backend/     API, database access, socket, import Excel
├─ frontend/    Trang web quản trị
├─ android/     Ứng dụng sinh viên
├─ database/    Tài liệu liên quan cơ sở dữ liệu
└─ *.md         Tài liệu triển khai, kiểm thử và hướng dẫn
```

## Công nghệ sử dụng

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- Socket.IO
- Multer
- XLSX

### Frontend

- React
- Vite
- Ant Design
- Axios
- React Router
- React Leaflet
- Socket.IO Client

### Android

- Kotlin
- Retrofit
- Gson
- DataStore
- Socket.IO client

## Chức năng chính

### Quản trị web

- Đăng nhập quản trị viên
- Quản lý sinh viên
- Import sinh viên từ file Excel hoặc CSV
- Tải template Excel mẫu
- Export danh sách sinh viên ra Excel
- Quản lý sự kiện và QR code
- Xem thống kê, danh sách điểm danh và dữ liệu realtime

### Ứng dụng sinh viên

- Đăng nhập bằng mã sinh viên và mật khẩu
- Đổi mật khẩu ở lần đăng nhập đầu tiên
- Xem danh sách sự kiện
- Đăng ký tham gia sự kiện
- Quét QR để điểm danh
- Xem lịch sử tham gia và điểm tích lũy

## Cài đặt và chạy dự án

### Yêu cầu môi trường

- Node.js 18 trở lên
- npm
- MongoDB Atlas hoặc MongoDB cục bộ
- Android Studio nếu cần chạy ứng dụng Android

### 1. Clone source code

```bash
git clone <repo-url>
cd DoAnCS2
```

### 2. Cấu hình backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend`:

```env
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Chạy backend:

```bash
npm run dev
```

### 3. Cấu hình frontend

```bash
cd frontend
npm install
```

Tạo file `.env` trong thư mục `frontend`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Chạy frontend:

```bash
npm run dev
```

### 4. Chạy Android

- Mở thư mục `android` bằng Android Studio
- Cấu hình địa chỉ API theo môi trường đang dùng
- Build và chạy ứng dụng trên thiết bị hoặc emulator

## Scripts đang dùng

### Backend

```bash
npm run dev
npm start
npm run seed:admin
npm run check-db
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Tạo dữ liệu mẫu

### Tạo admin đầu tiên

```bash
cd backend
npm run seed:admin
```

Script này tạo tài khoản admin đầu tiên nếu hệ thống chưa có.

### Tạo dữ liệu sinh viên và sự kiện mẫu

```bash
cd backend
node scripts/seedData.js
```

Script này kết nối trực tiếp tới MongoDB, xóa dữ liệu mẫu cũ và chèn lại dữ liệu mới để phục vụ kiểm thử.

## Import sinh viên bằng Excel

Hệ thống hỗ trợ import danh sách sinh viên từ file Excel hoặc CSV.

Luồng xử lý:

1. Admin tải file mẫu từ chức năng download template.
2. Admin chọn file trên trang quản lý sinh viên.
3. Frontend gửi file dạng `multipart/form-data` tới `POST /api/students/import`.
4. Backend dùng Multer lưu file tạm trong `backend/uploads`.
5. Backend dùng thư viện `xlsx` đọc file, kiểm tra dữ liệu bắt buộc, phát hiện trùng mã sinh viên hoặc email, sau đó tạo từng sinh viên trong database.
6. File tạm được xóa sau khi xử lý xong.

Các cột đang hỗ trợ gồm:

- Mã sinh viên
- Họ và tên
- Email
- Mật khẩu
- Lớp
- Ngành
- Số điện thoại
- Ngày sinh
- Device ID

## Một số API chính

### Xác thực

- `POST /api/auth/login`
- `GET /api/auth/me`

### Sinh viên

- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `POST /api/students/import`
- `GET /api/students/template`
- `GET /api/students/export`
- `GET /api/students/profile`

### Sự kiện và điểm danh

- `GET /api/events`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/attendances/check-in`
- `GET /api/attendances/event/:eventId`

## Lưu ý triển khai

- Không commit file `.env` thật lên git
- Cần thay `JWT_SECRET` và thông tin kết nối MongoDB khi triển khai production
- API hiện tại có cơ chế ràng buộc `deviceId` theo chính sách một thiết bị cho một tài khoản khi ứng dụng gửi lên `deviceId`
- Trường `isActive` đã được loại bỏ khỏi dữ liệu sinh viên, nên không dùng lại logic soft delete cũ

## Tài liệu liên quan

Trong repo đã có thêm nhiều tài liệu để phục vụ cài đặt, kiểm thử và báo cáo, ví dụ:

- `DEVELOPMENT_GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- `API_DOCUMENTATION.md`
- `BACKEND_TEST.md`
- `android/API_CONFIGURATION.md`

## Tác giả

Đỗ Danh Hùng Thái

## Ghi chú

README này mô tả trạng thái hiện tại của mã nguồn trong repository. Nếu có thay đổi về cấu hình môi trường, endpoint hoặc quy trình build Android, cần cập nhật lại tương ứng.
