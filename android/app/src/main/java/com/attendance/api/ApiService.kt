package com.attendance.api

import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

/**
 * API Interface - Retrofit Service
 * Kết nối với Backend API (Node.js + Express + MongoDB)
 */
interface ApiService {
    
    // ==================== AUTH APIs ====================

    /**
     * Login sinh viên 
     * POST /api/auth/student-login
     */
    @POST("auth/student-login")
    suspend fun studentLogin(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    /**
     * Đổi mật khẩu
     * POST /api/auth/change-password
     */
    @POST("auth/change-password")
    suspend fun changePassword(
        @Body request: ChangePasswordRequest
    ): Response<ChangePasswordResponse>

    /**
     * Lấy thông tin profile sinh viên đang đăng nhập
     * GET /api/students/profile
     */
    @GET("students/profile")
    suspend fun getStudentProfile(): Response<ApiResponse<StudentProfile>>

    // ==================== STUDENT APIs ====================

    /**
     * Tìm sinh viên theo mã SV
     * GET /api/students?search=SV001
     */
    @GET("students")
    suspend fun findStudent(
        @Query("search") studentCode: String
    ): Response<ApiResponse<List<Student>>>
    
    /**
     * Lấy thông tin sinh viên theo ID
     * GET /api/students/:id
     */
    @GET("students/{id}")
    suspend fun getStudentById(
        @Path("id") studentId: String
    ): Response<ApiResponse<Student>>

    /**
     * Tạo sinh viên mới 
     * POST /api/students
     */
    @POST("students")
    suspend fun createStudent(
        @Body student: Student
    ): Response<ApiResponse<Student>>

    // ==================== EVENT APIs ====================

    /**
     * Lấy danh sách sự kiện
     * GET /api/events?status=ongoing
     */
    @GET("events")
    suspend fun getEvents(
        @Query("status") status: String? = null
    ): Response<ApiResponse<List<Event>>>
    
    /**
     * Lấy chi tiết sự kiện theo ID
     * GET /api/events/:id
     */
    @GET("events/{id}")
    suspend fun getEventById(
        @Path("id") eventId: String
    ): Response<ApiResponse<Event>>
    
    /**
     * Tạo sự kiện mới (Admin only - nếu cần)
     * POST /api/events
     */
    @POST("events")
    suspend fun createEvent(
        @Body event: Event
    ): Response<ApiResponse<Event>>

    /**
     * Đăng ký tham gia sự kiện
     * POST /api/events/:id/register
     */
    @POST("events/{id}/register")
    suspend fun registerEvent(
        @Path("id") eventId: String
    ): Response<ApiResponse<EventRegistration>>

    /**
     * Lấy danh sách sự kiện đã đăng ký của sinh viên đang đăng nhập
     * GET /api/registrations/my-registrations
     */
    @GET("registrations/my-registrations")
    suspend fun getMyRegistrations(
        @Query("status") status: String? = null
    ): Response<ApiResponse<List<EventRegistration>>>

    // ==================== ATTENDANCE APIs ====================

    /**
     * Check-in (API Public - không cần token)
     * POST /api/attendances/check-in
     */
    @POST("attendances/check-in")
    suspend fun checkIn(
        @Body request: CheckInRequest
    ): Response<CheckInResponse>

    /**
     * Check-in with photo evidence (multipart/form-data)
     * POST /api/attendances/check-in
     */
    @Multipart
    @POST("attendances/check-in")
    suspend fun checkInWithPhoto(
        @Part("eventId") eventId: RequestBody,
        @Part("studentId") studentId: RequestBody,
        @Part("qrCode") qrCode: RequestBody,
        @Part("latitude") latitude: RequestBody,
        @Part("longitude") longitude: RequestBody,
        @Part evidencePhoto: MultipartBody.Part
    ): Response<CheckInResponse>
    
    /**
     * Lấy điểm của sinh viên đang đăng nhập
     * GET /api/attendances/my-points
     */
    @GET("attendances/my-points")
    suspend fun getMyPoints(): Response<ApiResponse<PointsData>>

    /**
     * Lấy bảng xếp hạng điểm
     * GET /api/attendances/leaderboard
     */
    @GET("attendances/leaderboard")
    suspend fun getLeaderboard(): Response<ApiResponse<LeaderboardData>>
    
    /**
     * Lấy lịch sử điểm danh của sinh viên
     * GET /api/attendances/student/:studentId
     */
    @GET("attendances/student/{studentId}")
    suspend fun getStudentAttendances(
        @Path("studentId") studentId: String
    ): Response<ApiResponse<List<Attendance>>>

    /**
     * Lấy lịch sử điểm danh của sinh viên đang đăng nhập
     * GET /api/attendances/my-history
     */
    @GET("attendances/my-history")
    suspend fun getAttendanceHistory(): Response<ApiResponse<List<Attendance>>>

    /**
     * Lấy danh sách điểm danh theo sự kiện
     * GET /api/attendances/event/:eventId
     */
    @GET("attendances/event/{eventId}")
    suspend fun getEventAttendances(
        @Path("eventId") eventId: String
    ): Response<ApiResponse<List<Attendance>>>

    // ==================== AI CHAT APIs ====================

    /**
     * Chat with AI assistant
     * POST /api/ai/chat
     */
    @POST("ai/chat")
    suspend fun chatWithAi(
        @Body request: AiChatRequest
    ): Response<ApiResponse<AiChatReply>>

    /**
     * Get suggested chat prompts
     * GET /api/ai/suggestions
     */
    @GET("ai/suggestions")
    suspend fun getAiSuggestions(): Response<ApiResponse<List<String>>>

    // ==================== HEALTH CHECK ====================

    /**
     * Kiểm tra kết nối với server
     * GET /api/health
     */
    @GET("health")
    suspend fun checkHealth(): Response<ApiResponse<Map<String, String>>>
}
