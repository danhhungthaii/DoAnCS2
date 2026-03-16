package com.attendance.utils

import android.util.Log
import com.attendance.api.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * API Test Helper - Kiểm tra kết nối với Backend
 */
object ApiTestHelper {

    private const val TAG = "ApiTestHelper"

    /**
     * Test kết nối với backend server
     */
    suspend fun testConnection(): TestResult {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Testing connection to: ${RetrofitClient.getBaseUrl()}")

                val response = RetrofitClient.apiService.checkHealth()

                if (response.isSuccessful) {
                    val body = response.body()
                    Log.d(TAG, "Health check successful: ${body?.data}")
                    TestResult.Success("Kết nối thành công với backend!")
                } else {
                    Log.e(TAG, "Health check failed: ${response.code()} - ${response.message()}")
                    TestResult.Error("Server trả về lỗi: ${response.code()}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Connection test failed", e)
                TestResult.Error("Không thể kết nối: ${e.message}")
            }
        }
    }

    /**
     * Test API lấy danh sách sinh viên
     */
    suspend fun testGetStudents(studentCode: String = "SV001"): TestResult {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Testing findStudent API with code: $studentCode")

                val response = RetrofitClient.apiService.findStudent(studentCode)

                if (response.isSuccessful && response.body()?.success == true) {
                    val students = response.body()?.data
                    Log.d(TAG, "Found ${students?.size ?: 0} students")
                    TestResult.Success("Tìm thấy ${students?.size ?: 0} sinh viên")
                } else {
                    Log.e(TAG, "Find student failed: ${response.message()}")
                    TestResult.Error("Không tìm thấy sinh viên")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Test find student failed", e)
                TestResult.Error("Lỗi API: ${e.message}")
            }
        }
    }

    /**
     * Test API lấy danh sách sự kiện
     */
    suspend fun testGetEvents(): TestResult {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Testing getEvents API")

                val response = RetrofitClient.apiService.getEvents(status = null)

                if (response.isSuccessful && response.body()?.success == true) {
                    val events = response.body()?.data
                    Log.d(TAG, "Found ${events?.size ?: 0} events")
                    TestResult.Success("Tìm thấy ${events?.size ?: 0} sự kiện")
                } else {
                    Log.e(TAG, "Get events failed: ${response.message()}")
                    TestResult.Error("Không lấy được danh sách sự kiện")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Test get events failed", e)
                TestResult.Error("Lỗi API: ${e.message}")
            }
        }
    }

    /**
     * Chạy tất cả tests
     */
    suspend fun runAllTests(): List<Pair<String, TestResult>> {
        val results = mutableListOf<Pair<String, TestResult>>()

        results.add("Health Check" to testConnection())
        results.add("Get Students" to testGetStudents())
        results.add("Get Events" to testGetEvents())

        return results
    }

    /**
     * Kết quả test
     */
    sealed class TestResult {
        data class Success(val message: String) : TestResult()
        data class Error(val message: String) : TestResult()
    }
}

