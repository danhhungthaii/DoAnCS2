package com.attendance

import android.Manifest
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.animation.LinearInterpolator
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityScanQrBinding
import com.attendance.utils.QRCodeAnalyzer
import com.attendance.utils.UIFeedback
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationToken
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.gms.tasks.OnTokenCanceledListener
import kotlinx.coroutines.launch
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * ScanQRActivity - Quét mã QR
 * Sử dụng CameraX và ML Kit để scan QR code
 */
class ScanQRActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityScanQrBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    
    private var eventId: String? = null
    private var eventTitle: String? = null
    
    private var currentLatitude: Double = 0.0
    private var currentLongitude: Double = 0.0
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScanQrBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        try {
            // Nhận dữ liệu từ Intent
            eventId = intent.getStringExtra("EVENT_ID")
            eventTitle = intent.getStringExtra("EVENT_TITLE")
            
            
            // Log for debugging
            Log.d("ScanQR", " App State: onCreate")
            Log.d("ScanQR", "  Event ID: $eventId")
            Log.d("ScanQR", " Event Title: $eventTitle")
            
            // Generic scan mode: event is determined by QR content
            if (eventId.isNullOrEmpty()) {
                binding.tvEventTitle.text = "Quét QR sự kiện"
                binding.tvInstruction.text = "Quét mã QR bất kỳ của sự kiện để điểm danh tự động"
            } else {
                binding.tvEventTitle.text = eventTitle ?: "Sự kiện"
                binding.tvInstruction.text = "Hướng camera vào mã QR của sự kiện này"
            }
        
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
            cameraExecutor = Executors.newSingleThreadExecutor()
            
            getCurrentLocation()
            startCamera()
            startScanLineAnimation()
            
            binding.btnBack.setOnClickListener {
                finish()
            }
        } catch (e: Exception) {
            Log.e("ScanQR", " Error in onCreate: ${e.message}", e)
            Toast.makeText(this, "Lỗi khởi tạo: ${e.message}", Toast.LENGTH_LONG).show()
            finish()
        }
    }
    
    private fun startScanLineAnimation() {
        val scanLine = binding.scanLine
        val scanArea = binding.scanAreaContainer
        
        // Animation di chuyển từ trên xuống dưới
        val animator = ValueAnimator.ofFloat(0f, 1f)
        animator.duration = 2000 // 2 giây
        animator.repeatCount = ValueAnimator.INFINITE
        animator.repeatMode = ValueAnimator.REVERSE
        animator.interpolator = LinearInterpolator()
        
        animator.addUpdateListener { animation ->
            val value = animation.animatedValue as Float
            val scanAreaHeight = scanArea.height
            val scanLineHeight = scanLine.height
            
            // Di chuyển từ 0 đến (scanAreaHeight - scanLineHeight)
            val translationY = value * (scanAreaHeight - scanLineHeight)
            scanLine.translationY = translationY
        }
        
        animator.start()
    }
    
    @SuppressLint("MissingPermission")
    private fun getCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Toast.makeText(this, "Chưa có quyền GPS", Toast.LENGTH_SHORT).show()
            return
        }
        
        fusedLocationClient.getCurrentLocation(
            Priority.PRIORITY_HIGH_ACCURACY,
            object : CancellationToken() {
                override fun onCanceledRequested(listener: OnTokenCanceledListener) = 
                    CancellationTokenSource().token
                override fun isCancellationRequested() = false
            }
        ).addOnSuccessListener { location ->
            if (location != null) {
                currentLatitude = location.latitude
                currentLongitude = location.longitude
                Log.d("ScanQR", "GPS: $currentLatitude, $currentLongitude")
            } else {
                Toast.makeText(this, "Không lấy được vị trí GPS", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(binding.previewView.surfaceProvider)
                }
            
            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor, QRCodeAnalyzer { qrCode ->
                        onQRCodeScanned(qrCode)
                    })
                }
            
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this,
                    cameraSelector,
                    preview,
                    imageAnalyzer
                )
            } catch (e: Exception) {
                Log.e("ScanQR", "Camera binding failed", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun onQRCodeScanned(qrCode: String) {
        Log.d("ScanQR", " QR Code scanned: $qrCode")
        
        // Haptic feedback + Sound
        UIFeedback.vibrateSuccess(this)
        UIFeedback.playBeep(this)
        
        try {
            if (qrCode.isBlank()) {
                Log.e("ScanQR", " Cannot proceed: QR code is empty!")
                showErrorDialog(
                    "QR không hợp lệ",
                    "Không quét được mã QR. Vui lòng thử lại."
                )
                return
            }
            
            // WORKFLOW: Validate QR format (must start with "EVENT-")
            if (!qrCode.startsWith("EVENT-")) {
                Log.e("ScanQR", " Invalid QR format: '$qrCode' (expected: EVENT-{eventId})")
                Log.e("ScanQR", "   Current eventId: $eventId")
                Log.e("ScanQR", "   QR code length: ${qrCode.length}")
                showErrorDialog(
                    "Mã QR không hợp lệ",
                    "Mã QR không đúng định dạng.\n\n" +
                    "Format cần: EVENT-{id}\n" +
                    "Format nhận: ${qrCode.take(50)}\n\n" +
                    "Vui lòng tạo lại QR code cho sự kiện này."
                )
                return
            }
            
            val qrEventId = qrCode.removePrefix("EVENT-")
            if (!eventId.isNullOrEmpty() && qrEventId != eventId) {
                Log.e("ScanQR", " QR event ID mismatch: QR=$qrEventId, Current=$eventId")
                showErrorDialog(
                    "Sai mã QR",
                    "Mã QR này không thuộc sự kiện \"$eventTitle\".\n\nVui lòng quét đúng mã QR của sự kiện bạn đang tham gia."
                )
                return
            }
            
            // Warn if GPS is not ready
            if (currentLatitude == 0.0 && currentLongitude == 0.0) {
                Log.w("ScanQR", "  GPS not ready yet (0,0)")
                showErrorDialog(
                    "Chưa có vị trí GPS",
                    "Đang lấy vị trí GPS...\n\nVui lòng đợi 5 giây và thử lại."
                )
                return
            }
            
            Log.d("ScanQR", " Current GPS: $currentLatitude, $currentLongitude")
            Log.d("ScanQR", " QR parsed successfully, loading event details")

            navigateToCheckInForm(qrEventId, qrCode)
        } catch (e: Exception) {
            Log.e("ScanQR", " Error processing QR code: ${e.message}", e)
            showErrorDialog(
                "Lỗi xử lý",
                "Đã xảy ra lỗi khi xử lý mã QR: ${e.message}"
            )
        }
    }

    private fun navigateToCheckInForm(qrEventId: String, qrCode: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getEventById(qrEventId)
                if (response.isSuccessful && response.body()?.success == true) {
                    val scannedEvent = response.body()?.data
                    val intent = Intent(this@ScanQRActivity, CheckInFormActivity::class.java).apply {
                        putExtra("EVENT_ID", qrEventId)
                        putExtra("EVENT_TITLE", scannedEvent?.title ?: "Sự kiện")
                        putExtra("QR_CODE", qrCode)
                    }
                    startActivity(intent)
                    finish()
                } else {
                    showErrorDialog(
                        "Không tìm thấy sự kiện",
                        "Không thể tải thông tin sự kiện từ mã QR. Vui lòng thử lại."
                    )
                }
            } catch (e: Exception) {
                Log.e("ScanQR", " Failed to load event by QR: ${e.message}", e)
                showErrorDialog(
                    "Lỗi kết nối",
                    "Không thể tải thông tin sự kiện. Vui lòng kiểm tra mạng và thử lại."
                )
            }
        }
    }
    
    /**
     * Hiển thị dialog lỗi (không đóng activity, cho phép scan lại)
     */
    private fun showErrorDialog(title: String, message: String) {
        runOnUiThread {
            androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle(title)
                .setMessage(message)
                .setIcon(android.R.drawable.ic_dialog_alert)
                .setPositiveButton("Quét lại") { dialog, _ -> 
                    dialog.dismiss()
                    // Camera vẫn đang chạy, user có thể quét lại
                }
                .setNegativeButton("Đóng") { _, _ ->
                    finish()
                }
                .setCancelable(false)
                .show()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
