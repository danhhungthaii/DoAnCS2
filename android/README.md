# Android App - Hệ thống Điểm danh QR

Ứng dụng Android native cho sinh viên điểm danh sự kiện bằng QR Code và GPS.

## Công nghệ sử dụng

- **Kotlin** 1.9.22
- **CameraX** 1.3.1 - Camera preview và capture
- **ML Kit Barcode Scanning** 17.2.0 - Quét mã QR
- **Retrofit 2** 9.0 - REST API client
- **Google Play Services Location** 21.1.0 - GPS định vị
- **DataStore** 1.0.0 - Lưu trữ session
- **Material Design 3** - UI components

## Cấu trúc thư mục

```
android/
├── app/
│   ├── build.gradle                    # Dependencies và cấu hình
│   └── src/main/
│       ├── AndroidManifest.xml         # Permissions & Activities
│       ├── java/com/attendance/
│       │   ├── MainActivity.kt         # Màn hình đăng nhập
│       │   ├── EventListActivity.kt    # Danh sách sự kiện
│       │   ├── ScanQRActivity.kt       # Quét mã QR
│       │   ├── CheckInActivity.kt      # Kết quả điểm danh
│       │   ├── adapters/
│       │   │   └── EventAdapter.kt     # RecyclerView adapter
│       │   ├── api/
│       │   │   ├── Models.kt           # Data classes
│       │   │   ├── ApiService.kt       # API endpoints
│       │   │   └── RetrofitClient.kt   # HTTP client
│       │   └── utils/
│       │       ├── PreferenceManager.kt    # Session storage
│       │       └── QRCodeAnalyzer.kt       # ML Kit analyzer
│       └── res/
│           ├── layout/                 # XML layouts
│           ├── values/                 # strings, colors, themes
│           ├── drawable/               # Icons, shapes
│           └── menu/                   # Menu items
└── build.gradle                        # Root gradle
```

## Quy trình hoạt động

1. **Đăng nhập**: Nhập mã sinh viên → Gọi API `/api/students/find` → Lưu session
2. **Danh sách sự kiện**: Gọi API `/api/events?status=ongoing` → Hiển thị RecyclerView
3. **Quét QR**: Mở camera → ML Kit phát hiện QR → Parse JSON (event_id, timestamp, code) → Lấy GPS
4. **Điểm danh**: Gọi API `/api/attendances/check-in` với GPS → Hiển thị kết quả (success/warning/error)

## Cấu hình Backend URL

File: `api/RetrofitClient.kt`

```kotlin
private const val BASE_URL = "http://10.0.2.2:5000/api"  // Android Emulator
// Nếu dùng thiết bị thật: thay bằng IP máy tính (vd: http://192.168.1.10:5000/api)
```

## Build và chạy

### Yêu cầu

- Android Studio Hedgehog | 2023.1.1 trở lên
- Android SDK 24-34 (Android 7.0 - 14.0)
- Backend server đang chạy ở `http://localhost:5000`

### Cách chạy

1. **Mở Android Studio**:
   ```bash
   cd android
   # Open in Android Studio
   ```

2. **Sync Gradle**:
   - Android Studio → File → Sync Project with Gradle Files

3. **Chạy trên Emulator**:
   - Tạo AVD (Android Virtual Device) với API 24+
   - Enable camera và GPS trong AVD settings
   - Run → app

4. **Chạy trên thiết bị thật**:
   - Enable Developer Options & USB Debugging
   - Đổi BASE_URL thành IP máy tính (vd: `http://192.168.1.10:5000/api`)
   - Kết nối USB hoặc WiFi debugging
   - Run → app

## Permissions

App yêu cầu các quyền sau:

- **CAMERA**: Quét mã QR
- **ACCESS_FINE_LOCATION**: Lấy tọa độ GPS chính xác
- **INTERNET**: Gọi API backend

Runtime permissions được xin trong `MainActivity.kt` khi đăng nhập thành công.

## API Endpoints sử dụng

1. **GET** `/api/students/find?search={studentCode}`
   - Tìm sinh viên để đăng nhập

2. **GET** `/api/events?status=ongoing`
   - Lấy danh sách sự kiện đang diễn ra

3. **POST** `/api/attendances/check-in`
   ```json
   {
     "eventId": "...",
     "studentId": "...",
     "qrCode": "...",
     "checkInLocation": {
       "latitude": 10.123,
       "longitude": 106.456
     }
   }
   ```
   - Response:
   ```json
   {
     "success": true,
     "message": "Check-in thành công",
     "data": {
       "attendance": {...},
       "event": {...},
       "distanceFromEvent": 5.2,
       "isValid": true
     }
   }
   ```

## Testing

### Test với Backend local

1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Tạo tài khoản test trong MongoDB:
   ```javascript
   // Student
   {
     studentCode: "SV001",
     fullName: "Nguyễn Văn A",
     email: "sva@student.edu.vn"
   }
   
   // Event
   {
     title: "Lễ khai giảng",
     status: "ongoing",
     location: {
       latitude: 10.762622,
       longitude: 106.660172
     },
     checkInRadius: 100
   }
   ```

3. Đăng nhập với `SV001` → Chọn sự kiện → Quét QR code từ Web Admin

### Test QR format

App chấp nhận QR với format JSON:
```json
{
  "event_id": "674bd4c8bbbad98c74e71a7d",
  "timestamp": 1734567890000,
  "code": "abc123"
}
```

## Troubleshooting

### Camera không hoạt động

- Check permission trong Settings → Apps → Điểm danh QR → Permissions
- Emulator: Enable "Use Host Webcam" trong AVD settings

### GPS không lấy được tọa độ

- Emulator: Mở Extended Controls (⋮) → Location → Set GPS coordinates
- Thiết bị thật: Enable Location Services, check permission

### Kết nối API thất bại

- Emulator: Đảm bảo `BASE_URL = "http://10.0.2.2:5000/api"`
- Thiết bị thật: Thay `10.0.2.2` bằng IP máy tính trong cùng mạng WiFi
- Kiểm tra backend đang chạy: `curl http://localhost:5000/api/health`
- Check firewall cho phép port 5000

### Quét QR không nhận diện

- QR code phải có format JSON hợp lệ
- Đủ ánh sáng, giữ camera ổn định
- Thử tạo QR mới từ Web Admin

## ViewBinding

App sử dụng ViewBinding thay vì `findViewById`:

```kotlin
// Enabled trong build.gradle
buildFeatures {
    viewBinding = true
}

// Usage
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        binding.btnLogin.setOnClickListener { ... }
    }
}
```

## Best Practices

- ✅ Sử dụng DataStore thay vì SharedPreferences
- ✅ Kotlin Coroutines cho async tasks
- ✅ Material Design 3 components
- ✅ Lifecycle-aware components (lifecycleScope)
- ✅ Proper permission handling
- ✅ Error handling với try-catch
- ✅ SwipeRefreshLayout cho UX tốt hơn

## License

Đồ án tốt nghiệp - Hệ thống Điểm danh QR & GPS
