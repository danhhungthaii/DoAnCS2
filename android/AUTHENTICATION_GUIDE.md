# ✅ AUTHENTICATION TOKEN - HƯỚNG DẪN

## 🔐 Vấn đề đã giải quyết

**Vấn đề:** Backend API yêu cầu JWT token cho các endpoint (Students, Events, etc.)
```json
{
  "success": false,
  "message": "Vui lòng đăng nhập để tiếp tục"
}
```

**Giải pháp:** Tích hợp authentication token vào Android app

---

## 🎯 CÁCH HOẠT ĐỘNG

### 1. Login Flow (Đã cập nhật)

```
Student nhập MSSV
    ↓
App gọi API: POST /api/auth/student-login
    {
      "studentCode": "SV001",
      "deviceId": "android-device-id"
    }
    ↓
Backend trả về:
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1...",
      "data": { student info }
    }
    ↓
App lưu:
    - Student info → DataStore
    - Token → DataStore
    - Token → RetrofitClient (memory)
    ↓
Navigate to EventListActivity
```

### 2. Authenticated API Requests

Mọi request API sau khi login **tự động** có header:
```
Authorization: Bearer eyJhbGciOiJIUzI1...
```

**Cách hoạt động:**
1. `AuthInterceptor` trong RetrofitClient tự động thêm token
2. Backend verify token
3. Cho phép truy cập API

---

## 🔧 CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### 1. **Models.kt** - Thêm token vào LoginResponse

```kotlin
data class LoginResponse(
    val success: Boolean,
    val message: String?,
    val token: String?,  // ← THÊM MỚI
    val data: Student?
)
```

---

### 2. **ApiService.kt** - Thêm student login endpoint

```kotlin
@POST("auth/student-login")
suspend fun studentLogin(
    @Body request: LoginRequest
): Response<LoginResponse>
```

**Request:**
```json
{
  "studentCode": "SV001",
  "deviceId": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "...",
    "studentCode": "SV001",
    "fullName": "Nguyễn Văn A",
    ...
  }
}
```

---

### 3. **RetrofitClient.kt** - AuthInterceptor

```kotlin
private var authToken: String? = null

fun setAuthToken(token: String?) {
    authToken = token
}

private class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        val newRequest = if (authToken != null) {
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $authToken")
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(newRequest)
    }
}
```

**Tự động thêm header cho mọi request:**
- Login → Không có token (chưa cần)
- Get Events → `Authorization: Bearer ...`
- Check-in → `Authorization: Bearer ...`

---

### 4. **PreferenceManager.kt** - Lưu token

```kotlin
fun saveStudent(student: Student, deviceId: String, token: String? = null) {
    // Lưu student data
    // Lưu token nếu có
    if (token != null) {
        prefs[AUTH_TOKEN] = token
    }
}

fun getAuthToken(): String? {
    return prefs[AUTH_TOKEN]
}
```

---

### 5. **MainActivity.kt** - Gọi API login

```kotlin
// Gọi API student login
val loginRequest = LoginRequest(studentCode, deviceId)
val response = RetrofitClient.apiService.studentLogin(loginRequest)

if (response.isSuccessful) {
    val student = response.body()?.data
    val token = response.body()?.token
    
    // Lưu token vào RetrofitClient
    if (token != null) {
        RetrofitClient.setAuthToken(token)
    }
    
    // Lưu vào DataStore
    prefManager.saveStudent(student, deviceId, token)
    
    // Navigate
    navigateToEventList()
}
```

---

### 6. **Load token khi khởi động**

**MainActivity.kt & EventListActivity.kt:**
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    // Load token từ DataStore
    val savedToken = prefManager.getAuthToken()
    if (savedToken != null) {
        RetrofitClient.setAuthToken(savedToken)
    }
    
    // Tiếp tục flow bình thường
}
```

---

## 📊 FLOW HOÀN CHỈNH

### Lần đầu login:
```
1. User nhập MSSV → Bấm đăng nhập
2. MainActivity gọi API studentLogin
3. Backend trả về token + student data
4. App lưu token vào:
   - DataStore (persistent)
   - RetrofitClient (memory)
5. Navigate to EventListActivity
6. Mọi API call có header Authorization
```

### Lần sau mở app:
```
1. MainActivity onCreate
2. Load token từ DataStore
3. Set token vào RetrofitClient
4. Check isLoggedIn → true
5. Navigate to EventListActivity
6. Mọi API call có header Authorization
```

---

## 🧪 KIỂM TRA LOG

### Login thành công:
```
D/MainActivity: login: Calling API studentLogin
D/MainActivity: login: API response code = 200, success = true
D/MainActivity: login: Student found - Nguyễn Văn A
D/MainActivity: login: Token received = true
D/PreferenceManager: saveStudent: Token saved
D/RetrofitClient: Auth token set
```

### Load token khi khởi động:
```
D/MainActivity: onCreate: Starting MainActivity
D/PreferenceManager: getAuthToken: Token found
D/MainActivity: onCreate: Loading saved token
D/RetrofitClient: Auth token set
D/MainActivity: onCreate: isLoggedIn = true
```

### API request với token:
```
D/OkHttp: --> GET http://10.0.2.2:5000/api/events
D/OkHttp: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
D/OkHttp: <-- 200 OK
```

---

## ⚠️ YÊU CẦU BACKEND

App đã sẵn sàng, nhưng **cần backend implement endpoint:**

### Endpoint cần thêm:

**POST /api/auth/student-login**

**Request Body:**
```json
{
  "studentCode": "SV001",
  "deviceId": "android-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "673abc...",
    "studentCode": "SV001",
    "fullName": "Nguyễn Văn A",
    "email": "sv001@example.com",
    "class": "DHKTPM15A",
    "major": "Công nghệ phần mềm"
  }
}
```

### Logic backend:
```javascript
// Backend pseudo-code
exports.studentLogin = async (req, res) => {
  const { studentCode, deviceId } = req.body;
  
  // 1. Tìm student theo studentCode
  const student = await Student.findOne({ studentCode });
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy sinh viên'
    });
  }
  
  // 2. Cập nhật deviceId (nếu cần)
  student.deviceId = deviceId;
  await student.save();
  
  // 3. Generate JWT token
  const token = generateToken(student._id);
  
  // 4. Return token + student data
  res.json({
    success: true,
    token,
    data: student
  });
};
```

---

## 🔒 BẢO MẬT

### Token được lưu:
- ✅ **DataStore** (encrypted by Android)
- ✅ **Memory** (RetrofitClient - mất khi app đóng)

### Token được gửi:
- ✅ Trong header `Authorization: Bearer ...`
- ✅ Tự động cho mọi API request
- ✅ Backend verify token trước khi cho phép truy cập

### Token expiry:
- Backend set expiry (VD: 7 days)
- Khi token hết hạn → API trả 401
- App detect 401 → Clear session → Navigate to login

---

## 📝 CHECKLIST

### App (Android) - ✅ ĐÃ XONG
- [x] Thêm token vào Models
- [x] API studentLogin endpoint
- [x] AuthInterceptor
- [x] Lưu token vào DataStore
- [x] Load token khi khởi động
- [x] Set token vào RetrofitClient
- [x] Auto header Authorization

### Backend - ⏳ CẦN THÊM
- [ ] Endpoint `POST /api/auth/student-login`
- [ ] Logic tìm student theo studentCode
- [ ] Generate JWT token cho student
- [ ] Return token + student data
- [ ] Verify token cho các API khác

---

## 🚀 NEXT STEPS

### 1. Backend team thêm endpoint
```bash
# File: backend/controllers/authController.js
exports.studentLogin = async (req, res) => {
  // Code như trên
};

# File: backend/routes/auth.js
router.post('/student-login', studentLogin);
```

### 2. Test endpoint
```bash
curl -X POST http://localhost:5000/api/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"studentCode":"SV001","deviceId":"test123"}'
```

Expected:
```json
{
  "success": true,
  "token": "eyJ...",
  "data": {...}
}
```

### 3. Test từ app
1. Run app
2. Nhập MSSV: SV001
3. Bấm đăng nhập
4. Xem Logcat → Thấy "Token received = true"
5. Navigate to EventList
6. Events load thành công (vì có token)

---

## 💡 TẠM THỜI (Nếu backend chưa có endpoint)

### Option 1: Dùng API findStudents (không recommend)
Backend cần bỏ auth middleware cho endpoint này

### Option 2: Mock token trong app (testing only)
```kotlin
// Temporary - for testing
val mockToken = "test-token-123"
RetrofitClient.setAuthToken(mockToken)
```

### Option 3: Request backend team ASAP ⭐ RECOMMENDED
Backend cần implement endpoint `student-login` để app hoạt động đúng

---

## 📚 TÀI LIỆU LIÊN QUAN

- `API_INTEGRATION_SUMMARY.md` - Tổng quan API
- `API_CONFIGURATION.md` - Cấu hình API URL
- `TROUBLESHOOTING_LOGIN.md` - Debug lỗi login

---

**Build Status:** ✅ BUILD SUCCESSFUL  
**Token Integration:** ✅ HOÀN THÀNH  
**Waiting for:** ⏳ Backend endpoint `/api/auth/student-login`

---

**Cập nhật:** 13/01/2026  
**Next:** Backend team implement student-login endpoint

