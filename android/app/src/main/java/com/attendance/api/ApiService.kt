package com.attendance.api

import retrofit2.Response
import retrofit2.http.*

/**
 * API Interface - Retrofit Service
 */
interface ApiService {
    
    /**
     * Tìm sinh viên theo mã SV và deviceId
     */
    @GET("students")
    suspend fun findStudent(
        @Query("search") studentCode: String
    ): Response<ApiResponse<List<Student>>>
    
    /**
     * Lấy danh sách sự kiện
     */
    @GET("events")
    suspend fun getEvents(
        @Query("status") status: String? = null
    ): Response<ApiResponse<List<Event>>>
    
    /**
     * Lấy chi tiết sự kiện
     */
    @GET("events/{id}")
    suspend fun getEventById(
        @Path("id") eventId: String
    ): Response<ApiResponse<Event>>
    
    /**
     * Check-in (API Public - không cần token)
     */
    @POST("attendances/check-in")
    suspend fun checkIn(
        @Body request: CheckInRequest
    ): Response<CheckInResponse>
    
    /**
     * Lấy lịch sử điểm danh của sinh viên
     */
    @GET("attendances/student/{studentId}")
    suspend fun getStudentAttendances(
        @Path("studentId") studentId: String
    ): Response<ApiResponse<List<Attendance>>>
}
