# Backend API Test - Quick Commands

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

---

## 🧪 Test Commands (cURL)

### 1️⃣ **LOGIN - Lấy Token**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Lưu token vào biến:**
```bash
# Windows PowerShell
$TOKEN = "<paste-token-here>"

# Linux/Mac
export TOKEN="<paste-token-here>"
```

---

### 2️⃣ **CREATE STUDENT**
```bash
# Windows PowerShell
curl -X POST http://localhost:5000/api/students `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "studentCode": "SV001",
    "fullName": "Nguyễn Văn A",
    "email": "nva@test.com",
    "phone": "0901234567",
    "class": "DHKTPM16A",
    "major": "Kỹ thuật phần mềm",
    "deviceId": "device-001"
  }'

# Linux/Mac
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentCode": "SV001",
    "fullName": "Nguyễn Văn A",
    "email": "nva@test.com",
    "phone": "0901234567",
    "class": "DHKTPM16A",
    "major": "Kỹ thuật phần mềm",
    "deviceId": "device-001"
  }'
```

**Lưu Student ID:**
```bash
# Lấy từ response: "data._id"
$STUDENT_ID = "<student-id>"
```

---

### 3️⃣ **CREATE EVENT**
```bash
# Windows PowerShell
curl -X POST http://localhost:5000/api/events `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Hội thảo Công nghệ AI 2026",
    "description": "Sự kiện về trí tuệ nhân tạo",
    "location": {
      "address": "268 Lý Thường Kiệt, P.14, Q.10, TP.HCM",
      "latitude": 10.7718,
      "longitude": 106.6574
    },
    "dateTime": "2026-01-20T08:00:00.000Z",
    "endDateTime": "2026-01-20T12:00:00.000Z",
    "checkInRadius": 100
  }'

# Linux/Mac
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hội thảo Công nghệ AI 2026",
    "description": "Sự kiện về trí tuệ nhân tạo",
    "location": {
      "address": "268 Lý Thường Kiệt, P.14, Q.10, TP.HCM",
      "latitude": 10.7718,
      "longitude": 106.6574
    },
    "dateTime": "2026-01-20T08:00:00.000Z",
    "endDateTime": "2026-01-20T12:00:00.000Z",
    "checkInRadius": 100
  }'
```

**Lưu Event ID và QR Code:**
```bash
# Từ response
$EVENT_ID = "<event-id>"
$QR_CODE = "<qr-code>"
```

---

### 4️⃣ **CHECK-IN (Trong bán kính)**
```bash
# Vị trí GẦN sự kiện (cách ~50m)
curl -X POST http://localhost:5000/api/attendances/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "'$EVENT_ID'",
    "studentId": "'$STUDENT_ID'",
    "qrCode": "'$QR_CODE'",
    "latitude": 10.7720,
    "longitude": 106.6576
  }'
```

**Expected:** `"isValid": true`, `"message": "Điểm danh thành công"`

---

### 5️⃣ **CHECK-IN (Ngoài bán kính)**
```bash
# Vị trí XA sự kiện (cách ~2km)
curl -X POST http://localhost:5000/api/attendances/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "'$EVENT_ID'",
    "studentId": "'$STUDENT_ID'",
    "qrCode": "'$QR_CODE'",
    "latitude": 10.7500,
    "longitude": 106.6400
  }'
```

**Expected:** `"isValid": false`, `"message": "...ngoài khu vực cho phép"`

---

### 6️⃣ **GET ATTENDANCES**
```bash
curl -X GET http://localhost:5000/api/attendances/event/$EVENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7️⃣ **REFRESH QR CODE**
```bash
curl -X POST http://localhost:5000/api/events/$EVENT_ID/qr \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📍 Test GPS Distances

### Vị trí Event: **10.7718, 106.6574** (268 Lý Thường Kiệt)

| User Location | Distance | isValid (radius=100m) |
|---------------|----------|----------------------|
| 10.7720, 106.6576 | ~50m | ✅ true |
| 10.7730, 106.6580 | ~150m | ❌ false |
| 10.7500, 106.6400 | ~2.5km | ❌ false |

---

## 🧮 Haversine Formula Test

```javascript
// Test trong Node.js
const { calculateDistance } = require('./utils/gpsHelper');

// Event location
const eventLat = 10.7718;
const eventLon = 106.6574;

// Test case 1: Gần sự kiện
const user1Lat = 10.7720;
const user1Lon = 106.6576;
const distance1 = calculateDistance(eventLat, eventLon, user1Lat, user1Lon);
console.log('Distance 1:', distance1, 'meters'); // ~50m

// Test case 2: Xa sự kiện
const user2Lat = 10.7500;
const user2Lon = 106.6400;
const distance2 = calculateDistance(eventLat, eventLon, user2Lat, user2Lon);
console.log('Distance 2:', distance2, 'meters'); // ~2500m
```

---

## ⚠️ Common Errors & Solutions

### Error: "QR code không hợp lệ hoặc đã hết hạn"
**Giải pháp:** Generate QR mới:
```bash
curl -X POST http://localhost:5000/api/events/$EVENT_ID/qr \
  -H "Authorization: Bearer $TOKEN"
```

### Error: "Bạn đã điểm danh cho sự kiện này rồi"
**Giải pháp:** Tạo Student mới hoặc xóa Attendance cũ trong database

### Error: "Token không hợp lệ"
**Giải pháp:** Login lại để lấy token mới

---

## 🔧 PowerShell Script (Windows)

Tạo file `test-api.ps1`:

```powershell
# 1. Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'

$TOKEN = $loginResponse.token
Write-Host "✅ Token: $TOKEN"

# 2. Create Student
$studentBody = @{
  studentCode = "SV002"
  fullName = "Trần Thị B"
  email = "ttb@test.com"
  phone = "0902222222"
  class = "DHKTPM16B"
  major = "Khoa học máy tính"
  deviceId = "device-002"
} | ConvertTo-Json

$studentResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/students" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -ContentType "application/json" `
  -Body $studentBody

$STUDENT_ID = $studentResponse.data._id
Write-Host "✅ Student ID: $STUDENT_ID"

# 3. Create Event
$eventBody = @{
  title = "Test Event PowerShell"
  description = "Testing"
  location = @{
    address = "Test Location"
    latitude = 10.7718
    longitude = 106.6574
  }
  dateTime = "2026-01-25T08:00:00.000Z"
  endDateTime = "2026-01-25T12:00:00.000Z"
  checkInRadius = 100
} | ConvertTo-Json -Depth 3

$eventResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/events" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -ContentType "application/json" `
  -Body $eventBody

$EVENT_ID = $eventResponse.data._id
$QR_CODE = $eventResponse.data.qrCode.code
Write-Host "✅ Event ID: $EVENT_ID"
Write-Host "✅ QR Code: $QR_CODE"

# 4. Check-in
$checkinBody = @{
  eventId = $EVENT_ID
  studentId = $STUDENT_ID
  qrCode = $QR_CODE
  latitude = 10.7720
  longitude = 106.6576
} | ConvertTo-Json

$checkinResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/attendances/check-in" `
  -Method POST `
  -ContentType "application/json" `
  -Body $checkinBody

Write-Host "✅ Check-in Response:"
$checkinResponse | ConvertTo-Json -Depth 3
```

**Chạy:**
```powershell
.\test-api.ps1
```

---

## 📊 Expected Results

### Successful Check-in (Within Radius)
```json
{
  "success": true,
  "message": "Điểm danh thành công",
  "data": {
    "distanceFromEvent": 50,
    "isValid": true,
    "status": "present"
  }
}
```

### Failed Check-in (Outside Radius)
```json
{
  "success": true,
  "message": "Điểm danh thành công nhưng bạn ở ngoài khu vực cho phép",
  "data": {
    "distanceFromEvent": 2500,
    "isValid": false,
    "status": "late"
  }
}
```

---

**Happy Testing! 🚀**
