package com.attendance.api

import com.google.gson.annotations.SerializedName

/**
 * Data Models cho API Response
 */

// Login Request
data class LoginRequest(
    val studentCode: String,
    val password: String,
    val deviceId: String? = null
)

// Login Response
data class LoginResponse(
    val success: Boolean,
    val message: String?,
    val token: String?,
    val data: Student?,
    val isFirstLogin: Boolean? = false
)

// Change Password Request
data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

// Change Password Response
data class ChangePasswordResponse(
    val success: Boolean,
    val message: String
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

// Student Profile (extended)
data class StudentProfile(
    @SerializedName("_id")
    val _id: String,
    val studentCode: String,
    val fullName: String,
    val email: String?,
    val phone: String?,
    @SerializedName("class")
    val classInfo: String?,
    val major: String?,
    val deviceId: String?,
    val isActive: Boolean?
)

// Event Model
data class Event(
    @SerializedName("_id")
    val _id: String,
    val title: String,
    val description: String?,
    val location: Location,
    val dateTime: String,
    val endDateTime: String,
    val checkInRadius: Int,
    val qrCode: QRCode?,
    val status: String,
    val isRegistered: Boolean? = false,
    val bannerUrl: String? = null
) {
    /**
     * Compute real-time event status based on current time
     * @return "upcoming" | "ongoing" | "completed" | "cancelled"
     */
    fun getComputedStatus(): String {
        // Manual override - always respect cancelled status
        if (status == "cancelled") return "cancelled"
        
        try {
            val now = java.util.Date()
            
            // Parse dateTime and endDateTime (ISO UTC format from backend)
            val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            format.timeZone = java.util.TimeZone.getTimeZone("UTC")
            
            val startDateTime = format.parse(dateTime)
            val endDateTime = format.parse(this.endDateTime)
            
            return when {
                startDateTime == null || endDateTime == null -> status
                now.before(startDateTime) -> "upcoming"
                now.after(endDateTime) -> "completed"
                else -> "ongoing"
            }
        } catch (e: Exception) {
            android.util.Log.e("Event", "Error computing status: ${e.message}")
            return status // Fallback to backend status
        }
    }
    
    /**
     * Get localized status text with emoji
     */
    fun getStatusText(): String {
        return when (getComputedStatus()) {
            "upcoming" -> " Sắp diễn ra"
            "ongoing" -> " Đang diễn ra"
            "completed" -> " Đã kết thúc"
            "cancelled" -> " Đã hủy"
            else -> status
        }
    }
}

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

// Registration Response Model
data class EventRegistration(
    @SerializedName("_id")
    val id: String,
    val student: Student,
    val event: RegistrationEvent,
    val registeredAt: String,
    val status: String
)

data class RegistrationEvent(
    @SerializedName("_id")
    val id: String,
    val title: String,
    val eventDate: String,
    val startTime: String,
    val location: Location
)

// Generic API Response
data class ApiResponse<T>(
    val success: Boolean,
    val message: String?,
    val data: T?
)

// AI Chat Models
data class AiChatMessage(
    val role: String,
    val content: String
)

data class AiChatRequest(
    val messages: List<AiChatMessage>
)

data class AiChatReply(
    val role: String,
    val content: String
)

// Points Data
data class PointsData(
    val student: Student? = null,
    val totalPoints: Double,
    val pointsHistory: List<PointsHistory> = emptyList(),
    val rank: Int? = null,
    val percentile: Double? = null
)

data class PointsHistory(
    @SerializedName("_id")
    val id: String,
    val event: PointsEvent,
    val basePoints: Double = 0.0,
    val bonusPoints: Double = 0.0,
    @SerializedName(value = "totalPoints", alternate = ["points"])
    val totalPoints: Double = 0.0,
    val reason: String? = null,
    @SerializedName(value = "awardedAt", alternate = ["earnedAt"])
    val awardedAt: String? = null
)

data class PointsEvent(
    @SerializedName("_id")
    val id: String,
    val title: String
)

// Leaderboard Entry
data class LeaderboardData(
    val leaderboard: List<LeaderboardEntry> = emptyList()
)

data class LeaderboardStudent(
    val studentCode: String,
    val fullName: String,
    @SerializedName("class")
    val className: String? = null
)

data class LeaderboardEntry(
    val rank: Int,
    val student: LeaderboardStudent,
    val totalPoints: Double,
    val eventsAttended: Int
)
