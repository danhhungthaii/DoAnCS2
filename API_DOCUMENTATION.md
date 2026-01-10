# API Documentation - Hệ thống Điểm danh QR Code & GPS

## Base URL
```
http://localhost:5000/api
```

---

## 📌 Authentication

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "username": "admin",
    "fullName": "Super Admin",
    "role": "super-admin"
  }
}
```

---

## 📅 Event APIs

### 1. Get All Events
**GET** `/events`

**Query Parameters:**
- `status` (optional): `upcoming` | `ongoing` | `completed`
- `search` (optional): Tìm kiếm theo title

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "event123",
      "title": "Hội thảo AI 2026",
      "description": "Sự kiện công nghệ AI",
      "location": {
        "address": "123 Nguyễn Huệ, Q1, TP.HCM",
        "coordinates": {
          "latitude": 10.762622,
          "longitude": 106.660172
        }
      },
      "dateTime": "2026-01-15T08:00:00.000Z",
      "endDateTime": "2026-01-15T12:00:00.000Z",
      "checkInRadius": 50,
      "qrCode": {
        "code": "EVENT_AI2026_1736928000",
        "expiresAt": "2026-01-15T08:05:00.000Z"
      },
      "status": "upcoming"
    }
  ]
}
```

---

### 2. Create Event
**POST** `/events`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Hội thảo Công nghệ AI 2026",
  "description": "Sự kiện về trí tuệ nhân tạo",
  "location": {
    "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "latitude": 10.762622,
    "longitude": 106.660172
  },
  "dateTime": "2026-01-15T08:00:00.000Z",
  "endDateTime": "2026-01-15T12:00:00.000Z",
  "checkInRadius": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo sự kiện thành công",
  "data": {
    "_id": "event123",
    "title": "Hội thảo Công nghệ AI 2026",
    "qrCode": {
      "code": "EVENT_AI2026_1736928000",
      "dataUrl": "data:image/png;base64,iVBORw0KG...",
      "expiresAt": "2026-01-15T08:05:00.000Z"
    }
  }
}
```

---

### 3. Generate New QR Code
**POST** `/events/:id/qr`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "QR code mới đã được tạo",
  "data": {
    "code": "EVENT_AI2026_NEW_1736928300",
    "dataUrl": "data:image/png;base64,iVBORw0KG...",
    "expiresAt": "2026-01-15T08:10:00.000Z"
  }
}
```

**Socket.IO Event Emitted:**
```javascript
io.to(`event-${eventId}`).emit('qr-updated', {
  eventId: eventId,
  qrCode: newQRCode,
  expiresAt: expiresAt
});
```

---

## 👨‍🎓 Student APIs

### 1. Get All Students
**GET** `/students`

**Query Parameters:**
- `search` (optional): Tìm theo tên hoặc mã SV
- `class` (optional): Lọc theo lớp

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "student123",
      "studentCode": "SV001",
      "fullName": "Nguyễn Văn A",
      "email": "nva@example.com",
      "phone": "0901234567",
      "class": "DHKTPM16A",
      "major": "Kỹ thuật phần mềm",
      "deviceId": "device-uuid-123",
      "isActive": true
    }
  ]
}
```

---

### 2. Create Student
**POST** `/students`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentCode": "SV001",
  "fullName": "Nguyễn Văn A",
  "email": "nva@example.com",
  "phone": "0901234567",
  "class": "DHKTPM16A",
  "major": "Kỹ thuật phần mềm",
  "deviceId": "device-uuid-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thêm sinh viên thành công",
  "data": {
    "_id": "student123",
    "studentCode": "SV001",
    "fullName": "Nguyễn Văn A"
  }
}
```

---

## ✅ Attendance APIs (Check-in)

### 1. Check-in (API Quan trọng nhất)
**POST** `/attendances/check-in`

**⚠️ Public API** - Không cần Authorization (cho Mobile App)

**Request Body:**
```json
{
  "eventId": "event123",
  "studentId": "student123",
  "qrCode": "EVENT_AI2026_1736928000",
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

**Logic xử lý:**

1. **Kiểm tra Event tồn tại**
2. **Kiểm tra Student tồn tại**
3. **Kiểm tra đã check-in chưa** (không cho check-in lại)
4. **Verify QR Code:**
   - Khớp với event
   - Chưa hết hạn (< 5 phút)
5. **Tính khoảng cách GPS** (Haversine Formula):
   ```javascript
   const distance = calculateDistance(
     event.location.coordinates.latitude,
     event.location.coordinates.longitude,
     userLatitude,
     userLongitude
   );
   ```
6. **Kiểm tra bán kính:**
   - Nếu `distance <= event.checkInRadius`: `isValid = true`
   - Ngược lại: `isValid = false` (vẫn lưu nhưng đánh dấu không hợp lệ)

**Response (Thành công - trong bán kính):**
```json
{
  "success": true,
  "message": "Điểm danh thành công",
  "data": {
    "_id": "attendance123",
    "event": "event123",
    "student": {
      "_id": "student123",
      "studentCode": "SV001",
      "fullName": "Nguyễn Văn A",
      "class": "DHKTPM16A"
    },
    "checkInTime": "2026-01-15T08:03:00.000Z",
    "checkInLocation": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "distanceFromEvent": 25,
    "isValid": true,
    "status": "present"
  }
}
```

**Response (Thành công - ngoài bán kính):**
```json
{
  "success": true,
  "message": "Điểm danh thành công nhưng bạn ở ngoài khu vực cho phép",
  "data": {
    "distanceFromEvent": 120,
    "isValid": false,
    "status": "late"
  }
}
```

**Response (Lỗi - QR hết hạn):**
```json
{
  "success": false,
  "message": "QR code không hợp lệ hoặc đã hết hạn"
}
```

**Response (Lỗi - Đã check-in):**
```json
{
  "success": false,
  "message": "Bạn đã điểm danh cho sự kiện này rồi"
}
```

**Socket.IO Event Emitted:**
```javascript
io.to(`event-${eventId}`).emit('new-check-in', {
  eventId: eventId,
  attendance: attendanceData
});
```

---

### 2. Get Attendances by Event
**GET** `/attendances/event/:eventId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "attendance123",
      "student": {
        "studentCode": "SV001",
        "fullName": "Nguyễn Văn A",
        "class": "DHKTPM16A"
      },
      "checkInTime": "2026-01-15T08:03:00.000Z",
      "distanceFromEvent": 25,
      "isValid": true
    }
  ]
}
```

---

### 3. Get Attendance Statistics
**GET** `/attendances/stats/:eventId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "valid": 142,
    "invalid": 8,
    "validPercentage": 94.67
  }
}
```

---

## 🔧 Haversine Formula (GPS Distance Calculation)

**File:** `backend/utils/gpsHelper.js`

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters

  return Math.round(distance);
};
```

**Ví dụ:**
```javascript
// Event location: 10.762622, 106.660172
// User location:  10.762800, 106.660300

const distance = calculateDistance(
  10.762622, 106.660172,  // Event
  10.762800, 106.660300   // User
);

console.log(distance); // Output: ~25 meters
```

---

## 🔄 Socket.IO Events

### Server → Client Events

#### 1. `new-check-in`
**Emitted when:** Sinh viên check-in thành công

**Room:** `event-${eventId}`

**Data:**
```javascript
{
  eventId: "event123",
  attendance: {
    _id: "attendance123",
    student: {
      studentCode: "SV001",
      fullName: "Nguyễn Văn A",
      class: "DHKTPM16A"
    },
    checkInTime: "2026-01-15T08:03:00.000Z",
    distanceFromEvent: 25,
    isValid: true
  }
}
```

#### 2. `qr-updated`
**Emitted when:** QR code được refresh

**Room:** `event-${eventId}`

**Data:**
```javascript
{
  eventId: "event123",
  qrCode: "EVENT_AI2026_NEW_1736928300",
  expiresAt: "2026-01-15T08:10:00.000Z"
}
```

### Client → Server Events

#### 1. `join-event`
**Usage:** Client join vào room để nhận realtime updates

```javascript
socket.emit('join-event', eventId);
```

#### 2. `leave-event`
**Usage:** Client rời khỏi room

```javascript
socket.emit('leave-event', eventId);
```

---

## 📊 Database Schemas

### Event Schema
```javascript
{
  title: String,              // Tên sự kiện
  description: String,        // Mô tả
  location: {
    address: String,          // Địa chỉ văn bản
    coordinates: {
      latitude: Number,       // -90 đến 90
      longitude: Number       // -180 đến 180
    }
  },
  dateTime: Date,            // Thời gian bắt đầu
  endDateTime: Date,         // Thời gian kết thúc
  checkInRadius: Number,     // Bán kính cho phép (mét) - Default: 50
  qrCode: {
    code: String,            // Unique QR code
    dataUrl: String,         // Base64 image
    expiresAt: Date          // Hết hạn sau 5 phút
  },
  status: String             // 'upcoming' | 'ongoing' | 'completed'
}
```

### Student Schema
```javascript
{
  studentCode: String,       // Mã SV (unique, uppercase)
  fullName: String,          // Họ tên
  email: String,            // Email (unique)
  phone: String,            // Số điện thoại (10-11 số)
  class: String,            // Lớp
  major: String,            // Ngành
  deviceId: String,         // Device UUID (sparse unique)
  isActive: Boolean         // Trạng thái hoạt động
}
```

### Attendance Schema
```javascript
{
  event: ObjectId,           // Ref: Event
  student: ObjectId,         // Ref: Student
  checkInTime: Date,        // Thời gian check-in
  checkInLocation: {
    latitude: Number,
    longitude: Number
  },
  distanceFromEvent: Number, // Khoảng cách (mét)
  isValid: Boolean,         // Có trong bán kính không
  qrCodeUsed: String,       // QR code đã dùng
  status: String            // 'present' | 'late' | 'absent'
}
```

---

## 🧪 Testing với Postman/Thunder Client

### 1. Login & Get Token
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### 2. Create Event
```bash
POST http://localhost:5000/api/events
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "title": "Test Event",
  "description": "Testing",
  "location": {
    "address": "Test Address",
    "latitude": 10.762622,
    "longitude": 106.660172
  },
  "dateTime": "2026-01-20T08:00:00.000Z",
  "endDateTime": "2026-01-20T12:00:00.000Z",
  "checkInRadius": 100
}
```

### 3. Test Check-in
```bash
POST http://localhost:5000/api/attendances/check-in
Content-Type: application/json

{
  "eventId": "<event-id-from-step-2>",
  "studentId": "<student-id>",
  "qrCode": "<qr-code-from-event>",
  "latitude": 10.762700,
  "longitude": 106.660200
}
```

---

## ⚠️ Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 400 | QR code không hợp lệ | QR đã hết hạn hoặc sai |
| 400 | Đã điểm danh rồi | Không cho check-in lại |
| 404 | Không tìm thấy sự kiện | Event ID sai |
| 404 | Không tìm thấy sinh viên | Student ID sai |
| 401 | Token không hợp lệ | JWT expired hoặc sai |
| 500 | Internal Server Error | Lỗi server |

---

## 📝 Notes

- **QR Code Expiry:** 5 phút (300 giây)
- **Default Check-in Radius:** 50 mét
- **Haversine Accuracy:** ~99.5% với khoảng cách < 1km
- **Socket.IO:** Auto-reconnect enabled
- **JWT Expiry:** 7 ngày

---

**Author:** Đỗ Danh Hùng Thảo  
**Project:** Hệ thống Điểm danh và Quản lý sự kiện bằng QR Code và GPS  
**Year:** 2026
