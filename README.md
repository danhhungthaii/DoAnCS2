# Hệ thống Điểm danh và Quản lý Sự kiện bằng QR Code và GPS

## Tech Stack

### Frontend Web (Admin)
- ReactJS (Vite)
- TailwindCSS / Ant Design
- React Router DOM
- Axios
- qrcode.react (tạo mã QR)
- react-leaflet (bản đồ)
- socket.io-client (realtime)

### Backend
- NodeJS
- ExpressJS
- Socket.io (realtime)
- JWT (authentication)
- Mongoose (MongoDB ODM)

### Database
- MongoDB

## Cấu trúc Dự án

```
DoAnCS2/
├── frontend/          # ReactJS Admin Web
├── backend/           # NodeJS API Server
└── database/          # MongoDB schemas & config
```

## Tính năng chính

### Web Admin
1. Đăng nhập Admin
2. Quản lý sự kiện (CRUD)
3. Chọn vị trí trên bản đồ (Lat/Long)
4. Màn hình chiếu mã QR động
5. Danh sách sinh viên check-in realtime
6. Xuất báo cáo Excel

## Hướng dẫn cài đặt

### Yêu cầu
- Node.js >= 16.x
- MongoDB >= 5.x
- npm hoặc yarn

### Cài đặt

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
