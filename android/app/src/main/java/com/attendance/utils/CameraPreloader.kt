package com.attendance.utils

import android.content.Context
import android.util.Log
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * CameraPreloader - Utility để pre-warm camera
 * 
 * Tối ưu:
 * - Pre-load CameraProvider khi vào event detail
 * - Camera mở ngay lập tức khi user click check-in
 * - Giảm delay từ 2s → 0.2s
 */
object CameraPreloader {
    
    private const val TAG = "CameraPreloader"
    private var cameraExecutor: ExecutorService? = null
    private var isPreloaded = false
    
    /**
     * Pre-warm camera provider
     */
    fun prewarmCamera(context: Context) {
        if (isPreloaded) {
            Log.d(TAG, "📷 Camera already preloaded")
            return
        }
        
        try {
            Log.d(TAG, "📷 Pre-warming camera...")
            
            // Initialize camera executor nếu chưa có
            if (cameraExecutor == null) {
                cameraExecutor = Executors.newSingleThreadExecutor()
            }
            
            // Get camera provider (this triggers initialization)
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            cameraProviderFuture.addListener({
                try {
                    val cameraProvider = cameraProviderFuture.get()
                    // Just getting the provider is enough to pre-warm it
                    Log.d(TAG, "✅ Camera pre-warmed successfully")
                    isPreloaded = true
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Camera pre-warm failed: ${e.message}")
                }
            }, ContextCompat.getMainExecutor(context))
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error pre-warming camera: ${e.message}")
        }
    }
    
    /**
     * Cleanup resources
     */
    fun cleanup() {
        cameraExecutor?.shutdown()
        cameraExecutor = null
        isPreloaded = false
        Log.d(TAG, "🧹 Camera preloader cleaned up")
    }
    
    /**
     * Check if camera is preloaded
     */
    fun isPreloaded(): Boolean = isPreloaded
}
