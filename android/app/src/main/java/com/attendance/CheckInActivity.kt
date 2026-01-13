package com.attendance

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.attendance.api.CheckInRequest
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityCheckInBinding
import com.attendance.utils.PreferenceManager
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * CheckInActivity - Xử lý Check-in
 * Gọi API check-in với GPS validation
 */
class CheckInActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityCheckInBinding
    private lateinit var prefManager: PreferenceManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCheckInBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        prefManager = PreferenceManager(this)
        
        val eventId = intent.getStringExtra("EVENT_ID") ?: ""
        val qrCodeData = intent.getStringExtra("QR_CODE") ?: ""
        val latitude = intent.getDoubleExtra("LATITUDE", 0.0)
        val longitude = intent.getDoubleExtra("LONGITUDE", 0.0)
        
        // Parse QR code để lấy code
        val qrCode = try {
            val json = JSONObject(qrCodeData)
            json.getString("code")
        } catch (e: Exception) {
            qrCodeData // Nếu không phải JSON, dùng nguyên chuỗi
        }
        
        performCheckIn(eventId, qrCode, latitude, longitude)
    }
    
    private fun performCheckIn(
        eventId: String,
        qrCode: String,
        latitude: Double,
        longitude: Double
    ) {
        binding.progressBar.visibility = View.VISIBLE
        binding.tvStatusTitle.text = "Đang xử lý điểm danh..."

        val student = prefManager.getStudent()
        if (student == null) {
            showError("Lỗi: Chưa đăng nhập")
            return
        }
        
        lifecycleScope.launch {
            try {
                val request = CheckInRequest(
                    eventId = eventId,
                    studentId = student.id,
                    qrCode = qrCode,
                    latitude = latitude,
                    longitude = longitude
                )
                
                val response = RetrofitClient.apiService.checkIn(request)
                
                binding.progressBar.visibility = View.GONE
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    val message = response.body()?.message ?: "Điểm danh thành công"
                    
                    if (data?.isValid == true) {
                        showSuccess(message, data.distanceFromEvent)
                    } else {
                        showWarning(message, data?.distanceFromEvent ?: 0)
                    }
                } else {
                    val errorMessage = response.body()?.message ?: 
                                     response.errorBody()?.string() ?: 
                                     "Lỗi không xác định"
                    showError(errorMessage)
                }
            } catch (e: Exception) {
                binding.progressBar.visibility = View.GONE
                showError("Lỗi kết nối: ${e.message}")
                e.printStackTrace()
            }
        }
    }
    
    private fun showSuccess(message: String, distance: Int) {
        binding.apply {
            tvStatusTitle.text = "✅ Điểm danh thành công!"
            tvMessage.text = message
            tvDistance.text = "Khoảng cách: $distance mét"
            tvDistance.visibility = View.VISIBLE
            cardDetails.visibility = View.VISIBLE

            ivStatus.setImageResource(android.R.drawable.ic_dialog_info)

            btnDone.visibility = View.VISIBLE
            btnDone.setOnClickListener {
                navigateToEventList()
            }
        }
    }
    
    private fun showWarning(message: String, distance: Int) {
        binding.apply {
            tvStatusTitle.text = "⚠️ Cảnh báo"
            tvMessage.text = message
            tvDistance.text = "Khoảng cách: $distance mét (Ngoài vùng cho phép)"
            tvDistance.visibility = View.VISIBLE
            cardDetails.visibility = View.VISIBLE

            ivStatus.setImageResource(android.R.drawable.ic_dialog_alert)

            btnDone.visibility = View.VISIBLE
            btnDone.setOnClickListener {
                navigateToEventList()
            }
        }
    }
    
    private fun showError(message: String) {
        binding.apply {
            tvStatusTitle.text = "❌ Điểm danh thất bại"
            tvMessage.text = message
            
            ivStatus.setImageResource(android.R.drawable.ic_delete)

            btnDone.visibility = View.VISIBLE
            btnDone.text = "Thử lại"
            btnDone.setOnClickListener {
                finish()
            }
        }
    }
    
    private fun navigateToEventList() {
        val intent = Intent(this, EventListActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)
        finish()
    }
}
