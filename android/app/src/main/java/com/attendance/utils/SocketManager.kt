package com.attendance.utils

import android.util.Log
import com.attendance.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

/**
 * SocketManager - Quản lý kết nối Socket.IO
 * Lắng nghe sự kiện real-time từ backend khi admin tạo/sửa sự kiện từ web
 */
object SocketManager {

    private const val TAG = "SocketManager"
    private var socket: Socket? = null
    private var currentStudentId: String? = null

    // Callbacks
    private var onNewEvent: ((JSONObject) -> Unit)? = null
    private var onVerificationResult: ((JSONObject) -> Unit)? = null
    private var onEventUpdated: ((JSONObject) -> Unit)? = null

    /**
     * Kết nối tới Socket.IO server với student ID
     * Tự động lấy URL từ API_BASE_URL của BuildConfig
     */
    fun connect(studentId: String? = null) {
        try {
            if (socket?.connected() == true) return

            // Build socket URL from API_BASE_URL: http://host:port/api/ -> http://host:port
            val socketUrl = BuildConfig.API_BASE_URL
                .removeSuffix("api/")
                .removeSuffix("/")
                .also { Log.d(TAG, "Connecting to: $it") }

            val options = IO.Options().apply {
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 2000
            }

            socket = IO.socket(socketUrl, options).apply {
                on(Socket.EVENT_CONNECT) {
                    Log.d(TAG, "✅ Socket connected")
                    
                    // Join student-specific room if studentId provided
                    studentId?.let { id ->
                        currentStudentId = id
                        emit("join-student", id)
                        Log.d(TAG, "📥 Joined student room: $id")
                    }
                }
                on(Socket.EVENT_DISCONNECT) {
                    Log.d(TAG, "❌ Socket disconnected")
                }
                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.e(TAG, "Socket error: ${args.firstOrNull()}")
                }

                // Lắng nghe sự kiện mới từ admin
                on("event:new") { args ->
                    try {
                        val data = args[0] as? JSONObject
                        if (data != null) {
                            Log.d(TAG, "📥 New event received: ${data.optString("title")}")
                            onNewEvent?.invoke(data)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing event:new", e)
                    }
                }

                // Listen for verification results (points awarded)
                on("verification-result") { args ->
                    try {
                        val data = args[0] as? JSONObject
                        if (data != null) {
                            Log.d(TAG, "📊 Verification result received")
                            onVerificationResult?.invoke(data)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing verification-result", e)
                    }
                }

                // Listen for event updates
                on("event-updated") { args ->
                    try {
                        val data = args[0] as? JSONObject
                        if (data != null) {
                            Log.d(TAG, "📢 Event updated")
                            onEventUpdated?.invoke(data)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing event-updated", e)
                    }
                }

                connect()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect socket", e)
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        Log.d(TAG, "Socket disconnected and cleaned up")
    }

    fun isConnected(): Boolean = socket?.connected() == true

    /**
     * Đăng ký callback khi có sự kiện mới được tạo từ web
     */
    fun setOnNewEventListener(callback: (JSONObject) -> Unit) {
        onNewEvent = callback
    }

    /**
     * Đăng ký callback khi nhận được kết quả xác nhận điểm danh (điểm được cộng)
     */
    fun setOnVerificationResultListener(callback: (JSONObject) -> Unit) {
        onVerificationResult = callback
    }

    /**
     * Đăng ký callback khi có sự kiện được cập nhật
     */
    fun setOnEventUpdatedListener(callback: (JSONObject) -> Unit) {
        onEventUpdated = callback
    }

    fun clearListeners() {
        onNewEvent = null
        onVerificationResult = null
        onEventUpdated = null
    }
}
