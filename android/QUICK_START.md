# ✅ HƯỚNG DẪN NHANH - SAU KHI SỬA LỖI

## 🎯 Tóm tắt
Đã sửa xong lỗi app bị crash/exit khi đăng nhập. App bây giờ có:
- ✅ Logging chi tiết để debug
- ✅ Kiểm tra dữ liệu trước khi chuyển màn hình
- ✅ Error handling tốt hơn
- ✅ Thông báo lỗi rõ ràng

## 🚀 Chạy app ngay

### 1. Build app (đã build xong)
```bash
cd C:\Users\danhh\DoAnCS2\android
.\gradlew assembleDebug
```
✅ BUILD SUCCESSFUL

### 2. Install trên emulator/device
Trong Android Studio:
1. Mở Android Studio
2. Run → Run 'app' (hoặc Shift+F10)
3. Chọn emulator/device

### 3. Test đăng nhập
1. Mở app "Điểm danh QR"
2. Nhập MSSV (ví dụ: SV001)
3. Bấm "Đăng nhập"
4. App sẽ chuyển sang màn hình danh sách sự kiện

## 🔍 Xem log (nếu cần debug)

### Trong Android Studio:
1. Mở tab Logcat (Alt+6)
2. Filter: `MainActivity|EventListActivity|PreferenceManager`
3. Chọn device/emulator đang chạy
4. Click nút đăng nhập và xem log

### Log messages khi thành công:
```
D/MainActivity: login: Attempting login with studentCode = SV001
D/MainActivity: login: Student found - [Tên sinh viên]
D/PreferenceManager: saveStudent: Student data saved successfully
D/MainActivity: navigateToEventList: Student = [Tên sinh viên]
D/EventListActivity: onCreate: isLoggedIn = true
D/EventListActivity: onCreate: Student = [Tên sinh viên]
```

## ⚠️ Nếu vẫn có lỗi

### Bước 1: Kiểm tra backend
```bash
# Trong thư mục backend
node server.js
```
Backend phải chạy ở port 5000

### Bước 2: Kiểm tra MongoDB
```bash
mongosh
use attendance_db
db.students.find()
```
Phải có ít nhất 1 sinh viên trong database

### Bước 3: Kiểm tra API URL
File: `app/build.gradle` (dòng 20)
```groovy
buildConfigField "String", "API_BASE_URL", "\"http://10.0.2.2:5000/api\""
```
- **Emulator**: Dùng `10.0.2.2` (đã đúng)
- **Thiết bị thật**: Thay bằng IP máy tính (VD: `192.168.1.10`)

### Bước 4: Test API trực tiếp
```bash
curl "http://localhost:5000/api/students?search=SV001"
```
Phải trả về dữ liệu sinh viên

### Bước 5: Clear app data
Settings → Apps → Điểm danh QR → Clear data
Hoặc uninstall và install lại

## 📋 Checklist trước khi test

- [ ] Backend đã chạy (port 5000)
- [ ] MongoDB đã chạy và có dữ liệu
- [ ] Build successful
- [ ] Emulator/device đã kết nối
- [ ] Logcat đã mở (để xem log nếu cần)

## 📱 Các tính năng đã sửa

### 1. Lưu dữ liệu an toàn hơn
- Tăng delay lên 1000ms
- Kiểm tra data đã lưu thành công
- Báo lỗi nếu lưu thất bại

### 2. Kiểm tra dữ liệu kỹ hơn
- Verify student data không null
- Kiểm tra isLoggedIn trước khi navigate
- Clear session nếu data corrupt

### 3. Error handling tốt hơn
- Catch tất cả exceptions
- Toast message chi tiết
- Không crash app

### 4. Logging chi tiết
- Log mọi bước đăng nhập
- Log save/load data
- Log navigation
- Dễ debug khi có lỗi

## 📝 Test cases

### Test 1: Đăng nhập thành công
1. Nhập MSSV: SV001
2. Bấm đăng nhập
3. Kỳ vọng: Hiện "Đăng nhập thành công! Chào [Tên]"
4. Chuyển sang màn hình danh sách sự kiện

### Test 2: MSSV không tồn tại
1. Nhập MSSV: SV999
2. Bấm đăng nhập
3. Kỳ vọng: Hiện "Không tìm thấy sinh viên với mã SV999"

### Test 3: Backend không chạy
1. Tắt backend
2. Nhập MSSV: SV001
3. Bấm đăng nhập
4. Kỳ vọng: Hiện "Lỗi kết nối: Failed to connect..."

### Test 4: Đã đăng nhập
1. Đăng nhập lần đầu thành công
2. Tắt app
3. Mở lại app
4. Kỳ vọng: Tự động vào màn hình danh sách sự kiện

### Test 5: Logout
1. Đăng nhập
2. Vào menu → Đăng xuất
3. Kỳ vọng: Quay về màn hình login

## 📚 Tài liệu thêm

- `TROUBLESHOOTING_LOGIN.md` - Hướng dẫn debug chi tiết
- `SUMMARY_CHANGES.md` - Chi tiết các thay đổi
- `README.md` - Hướng dẫn tổng quan

## 💡 Tips

1. **Luôn kiểm tra Logcat** khi có lỗi - log messages rất chi tiết
2. **Clear app data** nếu app hoạt động lạ
3. **Rebuild project** nếu có lỗi sau khi sửa code
4. **Test API bằng curl** trước khi test app
5. **Đảm bảo backend chạy** trước khi mở app

## 🆘 Hỗ trợ

Nếu vẫn gặp vấn đề, cung cấp:
1. Screenshot lỗi
2. Logcat output (filter MainActivity, EventListActivity)
3. MSSV đang test
4. Loại device (emulator/thiết bị thật)

---
**Cập nhật:** 13/01/2026
**Trạng thái:** ✅ Sẵn sàng test

