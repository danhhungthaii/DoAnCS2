package com.attendance.api

import com.google.gson.annotations.SerializedName

/**
 * Data Models cho API Response
 */

// Login Request
data class LoginRequest(
    val studentCode: String,
    val deviceId: String
)

// Login Response
data class LoginResponse(
    val success: Boolean,
    val message: String?,
    val data: Student?
)

// Student Model
data class Student(
    @SerializedName("_id")
    val id: String,
    val studentCode: String,
    val fullName: String,
    val email: String?,
    val phone: String?,
    @SerializedName("class")
    val className: String,
    val major: String?,
    val deviceId: String?
)

// Event Model
data class Event(
    @SerializedName("_id")
    val id: String,
    val title: String,
    val description: String?,
    val location: Location,
    val dateTime: String,
    val endDateTime: String,
    val checkInRadius: Int,
    val qrCode: QRCode?,
    val status: String
)

data class Location(
    val address: String,
    val coordinates: Coordinates
)

data class Coordinates(
    val latitude: Double,
    val longitude: Double
)

data class QRCode(
    val code: String,
    val expiresAt: String
)

// Check-in Request
data class CheckInRequest(
    val eventId: String,
    val studentId: String,
    val qrCode: String,
    val latitude: Double,
    val longitude: Double
)

// Check-in Response
data class CheckInResponse(
    val success: Boolean,
    val message: String,
    val data: Attendance?
)

// Attendance Model
data class Attendance(
    @SerializedName("_id")
    val id: String,
    val event: String,
    val student: Student,
    val checkInTime: String,
    val checkInLocation: CheckInLocation,
    val distanceFromEvent: Int,
    val isValid: Boolean,
    val status: String
)

data class CheckInLocation(
    val latitude: Double,
    val longitude: Double
)

// Generic API Response
data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?
)
