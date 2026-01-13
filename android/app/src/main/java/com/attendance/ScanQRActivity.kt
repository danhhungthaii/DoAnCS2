package com.attendance

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.attendance.databinding.ActivityScanQrBinding
import com.attendance.utils.QRCodeAnalyzer
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationToken
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.gms.tasks.OnTokenCanceledListener
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
    private var eventLatitude: Double = 0.0
    private var eventLongitude: Double = 0.0
    private var eventRadius: Int = 50
    
    private var currentLatitude: Double = 0.0
    private var currentLongitude: Double = 0.0
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScanQrBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Nhận dữ liệu từ Intent
        eventId = intent.getStringExtra("EVENT_ID")
        eventTitle = intent.getStringExtra("EVENT_TITLE")
        eventLatitude = intent.getDoubleExtra("EVENT_LATITUDE", 0.0)
        eventLongitude = intent.getDoubleExtra("EVENT_LONGITUDE", 0.0)
        eventRadius = intent.getIntExtra("EVENT_RADIUS", 50)
        
        binding.tvEventTitle.text = eventTitle
        binding.tvInstruction.text = "Hướng camera vào mã QR trên màn hình để điểm danh"
        
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        cameraExecutor = Executors.newSingleThreadExecutor()
        
        getCurrentLocation()
        startCamera()
        
        binding.btnBack.setOnClickListener {
            finish()
        }
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
        Log.d("ScanQR", "QR Code scanned: $qrCode")
        
        // Parse QR code (JSON format: {"event_id":"...","timestamp":...,"code":"..."})
        try {
            // Chuyển sang màn hình check-in
            val intent = Intent(this, CheckInActivity::class.java).apply {
                putExtra("EVENT_ID", eventId)
                putExtra("QR_CODE", qrCode)
                putExtra("LATITUDE", currentLatitude)
                putExtra("LONGITUDE", currentLongitude)
            }
            startActivity(intent)
            finish()
        } catch (e: Exception) {
            Toast.makeText(this, "QR code không hợp lệ", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}
