# 🚀 HƯỚNG DẪN CHẠY HỆ THỐNG HOÀN CHỈNH

## ✅ Đã khởi động

### 1. Backend API Server
- **URL**: http://localhost:5000
- **Status**: ✅ Running
- **MongoDB**: ✅ Connected to Atlas
- **Socket.IO**: ✅ Ready for realtime

### 2. Frontend Web Admin
- **URL**: http://localhost:5173
- **Status**: ✅ Running (Vite dev server)
- **Dùng cho**: Nhà trường quản lý sự kiện, hiển thị QR code

---

## 📱 Khởi động Android App

### Bước 1: Mở Android Studio
```bash
# Open Android Studio → Open Project → Chọn folder:
C:\Users\danhh\DoAnCS2\android
```

### Bước 2: Sync Gradle
- Đợi Android Studio tự động sync dependencies
- Nếu không tự động: File → Sync Project with Gradle Files

### Bước 3: Tạo/Chọn Emulator
**Tạo AVD mới** (nếu chưa có):
- Tools → Device Manager → Create Device
- Chọn: Pixel 5 hoặc Pixel 7
- API Level: 24-34 (recommended: 33 - Android 13)
- ✅ Enable: Use Host Webcam (cho camera)
- ✅ Enable: Location services (cho GPS)

### Bước 4: Chạy App
1. Click Run (▶️) hoặc Shift+F10
2. Chọn emulator vừa tạo
3. Đợi build và install (~2-3 phút lần đầu)

### Bước 5: Set GPS cho Emulator
1. Mở Extended Controls (⋮ button trên emulator)
2. Location → Set location:
   - Latitude: `10.762622`
   - Longitude: `106.660172`
   - (Gần phạm vi sự kiện test)

---

## 🧪 TEST FLOW HOÀN CHỈNH

### A. Trên WEB (http://localhost:5173)

1. **Đăng nhập Admin**:
   - Email: `admin@university.edu.vn`
   - Password: `Admin123!@#`

2. **Tạo sự kiện**:
   - Sidebar → Events → Create Event
   - Điền thông tin:
     - Tên: "Lễ khai giảng 2024"
     - Ngày: Hôm nay
     - Radius: 100m
   - Click map để chọn GPS: (10.762622, 106.660172)
   - Submit

3. **Hiển thị QR Code**:
   - Events table → Click "Hiển thị QR"
   - QR code tự động refresh mỗi 10 giây
   - Để màn hình này mở

### B. Trên ANDROID APP

1. **Đăng nhập**:
   - Mã sinh viên: `SV001`
   - (Nếu chưa có, tạo trong Web → Students → Create)

2. **Chọn sự kiện**:
   - Danh sách sự kiện → Click "Lễ khai giảng 2024"

3. **Quét QR**:
   - Camera mở → Hướng vào QR trên Web
   - Hoặc screenshot QR và mở trong emulator

4. **Xem kết quả**:
   - ✅ **Thành công** (màu xanh): Nếu trong bán kính 100m
   - ⚠️ **Cảnh báo** (màu cam): Nếu ngoài bán kính
   - ❌ **Lỗi** (màu đỏ): QR hết hạn hoặc lỗi khác

### C. Xác nhận Realtime (trên WEB)

- Màn hình QR Display sẽ tự động cập nhật danh sách điểm danh
- Socket.IO emit event `new-check-in`
- Table attendance hiện ngay không cần refresh

---

## ⚠️ Troubleshooting

### Android không kết nối Backend

**Emulator:**
- BASE_URL phải là `http://10.0.2.2:5000/api`
- Check: `api/RetrofitClient.kt` line 11

**Thiết bị thật:**
```kotlin
// Sửa trong RetrofitClient.kt:
private const val BASE_URL = "http://192.168.1.10:5000/api"  // IP máy tính
```

Tìm IP máy:
```powershell
ipconfig | findstr IPv4
```

### Camera không quét được QR

- Emulator: Extended Controls → Camera → Virtual scene
- Thiết bị thật: Cho phép permission Camera
- QR phải đủ sáng và rõ nét

### GPS không chính xác

**Emulator:**
```
Extended Controls → Location → Set coordinates:
- Latitude: 10.762622
- Longitude: 106.660172
```

**Thiết bị thật:**
- Enable Location Services
- Đứng trong bán kính sự kiện (100m)

### Web không hiện QR

- Check backend console: QR code phải auto-generate
- Sự kiện phải có status "ongoing"
- Try refresh page (Ctrl+R)

---

## 📊 Kiểm tra Log

### Backend (Terminal):
```
🚀 Server is running on port 5000
✅ MongoDB Connected
Socket.IO event: new-check-in
```

### Android (Logcat):
```
D/Retrofit: --> POST /api/attendances/check-in
D/Location: GPS: (10.762622, 106.660172)
I/CheckIn: Distance: 5.2 meters, isValid: true
```

### Frontend (Browser Console):
```
Socket connected: xxxx
New check-in received: {student: "SV001", ...}
```

---

## 🎯 Test Cases

| Tình huống | GPS Distance | Kết quả mong đợi |
|-----------|-------------|------------------|
| Trong bán kính | < 100m | ✅ Success (green) |
| Ngoài bán kính | > 100m | ⚠️ Warning (orange) |
| QR hết hạn | N/A | ❌ Error (red) |
| Sai mã QR | N/A | ❌ Error (red) |

---

## 🔥 Quick Commands

**Stop servers:**
```powershell
# Ctrl+C trong terminal backend
# Ctrl+C trong terminal frontend
```

**Restart backend:**
```powershell
cd backend; npm run dev
```

**Rebuild Android:**
```
Android Studio → Build → Clean Project → Rebuild Project
```

---

## ✅ Checklist hoàn thành

- [x] Backend API chạy port 5000
- [x] Frontend Web chạy port 5173
- [x] MongoDB Atlas connected
- [x] Socket.IO ready
- [ ] Android Studio opened
- [ ] AVD Emulator created
- [ ] Android app running
- [ ] Test check-in thành công

**Sau khi làm đủ checklist → Hệ thống hoàn chỉnh! 🎉**
