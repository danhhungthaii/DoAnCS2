package com.attendance.utils

import android.content.Context
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

/**
 * PreferenceManager - Quản lý session và lưu trữ dữ liệu local
 */
class PreferenceManager(private val context: Context) {
    
    private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "attendance_prefs")
    
    companion object {
        private val STUDENT_DATA = stringPreferencesKey("student_data")
        private val DEVICE_ID = stringPreferencesKey("device_id")
        private val IS_LOGGED_IN = stringPreferencesKey("is_logged_in")
    }
    
    private val gson = Gson()
    
    /**
     * Lưu thông tin sinh viên
     */
    fun saveStudent(student: Student, deviceId: String) {
        runBlocking {
            context.dataStore.edit { prefs ->
                prefs[STUDENT_DATA] = gson.toJson(student)
                prefs[DEVICE_ID] = deviceId
                prefs[IS_LOGGED_IN] = "true"
            }
        }
    }
    
    /**
     * Lấy thông tin sinh viên
     */
    fun getStudent(): Student? {
        return runBlocking {
            val json = context.dataStore.data.map { prefs ->
                prefs[STUDENT_DATA]
            }.first()
            
            json?.let { gson.fromJson(it, Student::class.java) }
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
     * Kiểm tra đã login chưa
     */
    fun isLoggedIn(): Boolean {
        return runBlocking {
            context.dataStore.data.map { prefs ->
                prefs[IS_LOGGED_IN] == "true"
            }.first()
        }
    }
    
    /**
     * Xóa session (Logout)
     */
    fun clearSession() {
        runBlocking {
            context.dataStore.edit { prefs ->
                prefs.clear()
            }
        }
    }
}
