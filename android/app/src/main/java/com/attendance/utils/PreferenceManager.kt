package com.attendance.utils

import android.content.Context
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.attendance.api.Student
import com.google.gson.Gson
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking

// Tạo DataStore extension ở top-level (singleton)
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "attendance_prefs")

/**
 * PreferenceManager - Quản lý session và lưu trữ dữ liệu local
 * Sử dụng Singleton pattern để tránh multiple DataStore instances
 */
class PreferenceManager private constructor(private val context: Context) {
    
    companion object {
        private const val TAG = "PreferenceManager"
        private val STUDENT_DATA = stringPreferencesKey("student_data")
        private val DEVICE_ID = stringPreferencesKey("device_id")
        private val IS_LOGGED_IN = stringPreferencesKey("is_logged_in")
        private val AUTH_TOKEN = stringPreferencesKey("auth_token")
        
        @Volatile
        private var INSTANCE: PreferenceManager? = null
        
        fun getInstance(context: Context): PreferenceManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: PreferenceManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
    
    private val gson = Gson()
    
    /**
     * Lưu thông tin sinh viên
     */
    fun saveStudent(student: Student, deviceId: String, token: String? = null) {
        try {
            Log.d(TAG, "saveStudent: Saving student ${student.fullName} (${student.studentCode})")
            runBlocking {
                context.dataStore.edit { prefs ->
                    prefs[STUDENT_DATA] = gson.toJson(student)
                    prefs[DEVICE_ID] = deviceId
                    prefs[IS_LOGGED_IN] = "true"
                    if (token != null) {
                        prefs[AUTH_TOKEN] = token
                        Log.d(TAG, "saveStudent: Token saved")
                    }
                }
            }
            Log.d(TAG, "saveStudent: Student data saved successfully")
        } catch (e: Exception) {
            Log.e(TAG, "saveStudent: Failed to save student data", e)
            e.printStackTrace()
            throw e
        }
    }
    
    /**
     * Lấy thông tin sinh viên
     */
    fun getStudent(): Student? {
        return try {
            val student = runBlocking {
                val json = context.dataStore.data.map { prefs ->
                    prefs[STUDENT_DATA]
                }.first()

                json?.let { gson.fromJson(it, Student::class.java) }
            }
            Log.d(TAG, "getStudent: Retrieved student ${student?.fullName ?: "null"}")
            student
        } catch (e: Exception) {
            Log.e(TAG, "getStudent: Failed to retrieve student data", e)
            e.printStackTrace()
            null
        }
    }
    
    /**
     * Lấy Device ID
     */
    fun getDeviceId(): String {
        return runBlocking {
            context.dataStore.data.map { prefs ->
                prefs[DEVICE_ID] ?: ""
            }.first()
        }
    }
    
    /**
     * Lấy Auth Token
     */
    fun getAuthToken(): String? {
        return try {
            val token = runBlocking {
                context.dataStore.data.map { prefs ->
                    prefs[AUTH_TOKEN]
                }.first()
            }
            Log.d(TAG, "getAuthToken: Token ${if (token != null) "found" else "not found"}")
            token
        } catch (e: Exception) {
            Log.e(TAG, "getAuthToken: Failed to get token", e)
            null
        }
    }

    /**
     * Kiểm tra đã login chưa
     */
    fun isLoggedIn(): Boolean {
        return try {
            val loggedIn = runBlocking {
                context.dataStore.data.map { prefs ->
                    prefs[IS_LOGGED_IN] == "true"
                }.first()
            }
            Log.d(TAG, "isLoggedIn: $loggedIn")
            loggedIn
        } catch (e: Exception) {
            Log.e(TAG, "isLoggedIn: Failed to check login status", e)
            e.printStackTrace()
            false
        }
    }
    
    /**
     * Xóa session (Logout)
     */
    fun clearSession() {
        try {
            Log.d(TAG, "clearSession: Clearing all session data")
            runBlocking {
                context.dataStore.edit { prefs ->
                    prefs.clear()
                }
            }
            Log.d(TAG, "clearSession: Session cleared successfully")
        } catch (e: Exception) {
            Log.e(TAG, "clearSession: Failed to clear session", e)
            e.printStackTrace()
        }
    }

    /**
     * Clear all data (alias for clearSession)
     */
    fun clearAll() {
        clearSession()
    }

    /**
     * Get student code
     */
    fun getStudentCode(): String? {
        return getStudent()?.studentCode
    }

    /**
     * Get full name
     */
    fun getFullName(): String? {
        return getStudent()?.fullName
    }
}
