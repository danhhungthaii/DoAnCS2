# Database Design - Attendance QR System

## MongoDB Collections

### 1. users (Quản lý Admin)

```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  fullName: String (required),
  role: String (enum: ['admin', 'super-admin']),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- username (unique)
- email (unique)

---

### 2. events (Quản lý Sự kiện)

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  eventDate: Date (required),
  startTime: String (format: "HH:mm"),
  endTime: String (format: "HH:mm"),
  location: {
    address: String (required),
    coordinates: {
      latitude: Number (min: -90, max: 90),
      longitude: Number (min: -180, max: 180)
    }
  },
  checkInRadius: Number (default: 100, unit: meters),
  qrCode: {
    code: String (unique),
    expiresAt: Date
  },
  status: String (enum: ['upcoming', 'ongoing', 'completed', 'cancelled']),
  createdBy: ObjectId (ref: 'User'),
  maxAttendees: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. students (Danh sách Sinh viên)

```javascript
{
  _id: ObjectId,
  studentCode: String (unique, required),
  fullName: String (required),
  email: String (unique, required),
  phone: String,
  class: String (required),
  major: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 4. attendances (Bản ghi Điểm danh)

```javascript
{
  _id: ObjectId,
  event: ObjectId (ref: 'Event', required),
  student: ObjectId (ref: 'Student', required),
  checkInTime: Date (default: Date.now),
  checkInLocation: {
    latitude: Number (required),
    longitude: Number (required)
  },
  distanceFromEvent: Number (unit: meters),
  isValid: Boolean (default: true),
  qrCodeUsed: String,
  status: String (enum: ['present', 'late', 'absent']),
  createdAt: Date,
  updatedAt: Date
}
```

## Relationships

- User (1) → Event (N)
- Event (1) → Attendance (N)
- Student (1) → Attendance (N)
