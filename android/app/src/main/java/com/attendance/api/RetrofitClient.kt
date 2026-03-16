package com.attendance.api

import android.content.Context
import android.util.Log
import com.attendance.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Retrofit Client - Singleton
 * Kết nối với Backend API
 *
 * CẤU HÌNH URL:
 *
 * 1. EMULATOR (Android Studio):
 *    private const val BASE_URL = "http://10.0.2.2:5000/api/"
 *
 * 2. DEVICE THẬT (qua cùng WiFi):
 *    private const val BASE_URL = "http://YOUR_LOCAL_IP:5000/api/"
 *    Ví dụ: "http://192.168.1.100:5000/api/"
 *
 * 3. PRODUCTION SERVER:
 *    private const val BASE_URL = "https://your-domain.com/api/"
 *
 * Để lấy IP máy tính:
 * - Windows: ipconfig (tìm IPv4 Address)
 * - Mac/Linux: ifconfig (tìm inet)
 */
object RetrofitClient {
    
    private const val TAG = "RetrofitClient"

    // ⚠️ THAY ĐỔI URL Ở ĐÂY:
    // Emulator: "http://10.0.2.2:5000/api/"
    // Device thật: "http://YOUR_LOCAL_IP:5000/api/"
    private val BASE_URL = BuildConfig.API_BASE_URL

    private var authToken: String? = null

    init {
        Log.d(TAG, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        Log.d(TAG, "RetrofitClient initialized")
        Log.d(TAG, "BASE_URL: $BASE_URL")
        Log.d(TAG, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    }

    /**
     * Set authentication token
     */
    fun setAuthToken(token: String?) {
        authToken = token
        Log.d(TAG, "Auth token ${if (token != null) "set" else "cleared"}")
    }

    /**
     * Get current auth token
     */
    fun getAuthToken(): String? = authToken

    /**
     * Auth Interceptor - Tự động thêm token vào header
     */
    private class AuthInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val originalRequest = chain.request()

            // Nếu có token, thêm vào header
            val requestBuilder = originalRequest.newBuilder()
                .addHeader("ngrok-skip-browser-warning", "true") // Bypass ngrok warning page
                .addHeader("User-Agent", "AttendanceQR-Android")  // Custom user agent
            
            if (authToken != null) {
                requestBuilder.addHeader("Authorization", "Bearer $authToken")
            }

            return chain.proceed(requestBuilder.build())
        }
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.BASIC
        }
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor())
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService::class.java)

    /**
     * Get current API URL
     */
    fun getBaseUrl(): String = BASE_URL
}
