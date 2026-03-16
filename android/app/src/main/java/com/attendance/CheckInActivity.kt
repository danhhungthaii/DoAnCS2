package com.attendance

import android.content.Intent
import android.os.Bundle
import android.util.Log
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
        
        try {
            prefManager = PreferenceManager.getInstance(this)
            
            val eventId = intent.getStringExtra("EVENT_ID") ?: ""
            val qrCodeData = intent.getStringExtra("QR_CODE") ?: ""
            val latitude = intent.getDoubleExtra("LATITUDE", 0.0)
            val longitude = intent.getDoubleExtra("LONGITUDE", 0.0)
            
            // Log for debugging
            Log.d("CheckIn", " App State: onCreate")
            Log.d("CheckIn", "️  Event ID: $eventId")
            Log.d("CheckIn", " QR Code: $qrCodeData")
            Log.d("CheckIn", " Location: $latitude, $longitude")
            
            // Validate input data
            if (eventId.isEmpty()) {
                Log.e("CheckIn", " Event ID is empty!")
                showError("Lỗi: Không có thông tin sự kiện")
                return
            }
            
            if (qrCodeData.isEmpty()) {
                Log.e("CheckIn", " QR Code is empty!")
                showError("Lỗi: Mã QR không hợp lệ")
                return
            }
            
            // Parse QR code để lấy code
            val qrCode = try {
                val json = JSONObject(qrCodeData)
                json.getString("code")
            } catch (e: Exception) {
                Log.d("CheckIn", "QR is not JSON, using raw string")
                qrCodeData // Nếu không phải JSON, dùng nguyên chuỗi
            }
            
            Log.d("CheckIn", " Parsed QR Code: $qrCode")
            Log.d("CheckIn", " All validations passed, performing check-in")
            
            performCheckIn(eventId, qrCode, latitude, longitude)
        } catch (e: Exception) {
            Log.e("CheckIn", " Error in onCreate: ${e.message}", e)
            showError("Lỗi khởi tạo: ${e.message}")
        }
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
            Log.e("CheckIn", " Student is null - not logged in!")
            showError("Lỗi: Chưa đăng nhập")
            return
        }
        
        Log.d("CheckIn", " Student: ${student.studentCode} - ${student.fullName}")
        Log.d("CheckIn", " Sending check-in request...")
        
        lifecycleScope.launch {
            try {
                val request = CheckInRequest(
                    eventId = eventId,
                    studentId = student.id,
                    qrCode = qrCode,
                    latitude = latitude,
                    longitude = longitude
                )
                
                Log.d("CheckIn", " Request: eventId=$eventId, studentId=${student.id}, qrCode=$qrCode")
                
                val response = RetrofitClient.apiService.checkIn(request)
                
                Log.d("CheckIn", " Response code: ${response.code()}")
                
                binding.progressBar.visibility = View.GONE
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    val message = response.body()?.message ?: "Điểm danh thành công"
                    
                    Log.d("CheckIn", " Check-in successful: $message")
                    Log.d("CheckIn", " Distance: ${data?.distanceFromEvent}m, Valid: ${data?.isValid}")
                    
                    if (data?.isValid == true) {
                        showSuccess(message, data.distanceFromEvent)
                    } else {
                        showWarning(message, data?.distanceFromEvent ?: 0)
                    }
                } else {
                    // WORKFLOW: Enhanced error handling dựa vào status code
                    val statusCode = response.code()
                    val errorMessage = response.body()?.message ?: "Lỗi không xác định"
                    
                    Log.e("CheckIn", " Check-in failed: Code=$statusCode, Msg=$errorMessage")
                    
                    // Hiển thị error với dialog thay vì layout
                    showErrorDialog(statusCode, errorMessage)
                }
            } catch (e: Exception) {
                Log.e("CheckIn", " Exception during check-in: ${e.message}", e)
                binding.progressBar.visibility = View.GONE
                showError("Lỗi kết nối: ${e.message}")
            }
        }
    }
    
    private fun showSuccess(message: String, distance: Int) {
        binding.apply {
            tvStatusTitle.text = " Điểm danh thành công!"
            tvMessage.text = message
            tvDistance.text = "Khoảng cách: $distance mét"
            tvDistance.visibility = View.VISIBLE
            cardDetails.visibility = View.VISIBLE

            ivStatus.setImageResource(android.R.drawable.ic_dialog_info)

            btnDone.visibility = View.VISIBLE
            btnDone.setOnClickListener {
                navigateToHome()
            }
        }
    }
    
    private fun showWarning(message: String, distance: Int) {
        binding.apply {
            tvStatusTitle.text = "️ Cảnh báo"
            tvMessage.text = message
            tvDistance.text = "Khoảng cách: $distance mét (Ngoài vùng cho phép)"
            tvDistance.visibility = View.VISIBLE
            cardDetails.visibility = View.VISIBLE

            ivStatus.setImageResource(android.R.drawable.ic_dialog_alert)

            btnDone.visibility = View.VISIBLE
            btnDone.setOnClickListener {
                navigateToHome()
            }
        }
    }
    
    private fun showError(message: String) {
        binding.apply {
            tvStatusTitle.text = " Điểm danh thất bại"
            tvMessage.text = message
            
            ivStatus.setImageResource(android.R.drawable.ic_delete)

            btnDone.visibility = View.VISIBLE
            btnDone.text = "Thử lại"
            btnDone.setOnClickListener {
                finish()
            }
        }
    }
    
    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        startActivity(intent)
        finish()
    }
    
    /**
     * WORKFLOW: Enhanced error dialog với message rõ ràng theo status code
     */
    private fun showErrorDialog(statusCode: Int, message: String) {
        val (title, detailedMessage, icon) = when (statusCode) {
            400 -> Triple(
                "Mã QR không hợp lệ",
                message + "\n\nVui lòng kiểm tra:\n• Quét đúng mã QR của sự kiện\n• Mã QR còn hiệu lực",
                android.R.drawable.ic_dialog_alert
            )
            401 -> Triple(
                "Chưa đăng nhập",
                "Phiên đăng nhập đã hết hạn.\n\nVui lòng đăng nhập lại.",
                android.R.drawable.ic_lock_idle_lock
            )
            403 -> Triple(
                "Ngoài bán kính cho phép",
                message + "\n\nBạn cần di chuyển đến gần địa điểm sự kiện hơn để điểm danh.",
                android.R.drawable.ic_dialog_alert
            )
            404 -> Triple(
                "Không tìm thấy sự kiện",
                "Sự kiện không tồn tại hoặc đã bị xóa.\n\nVui lòng thử lại hoặc liên hệ quản trị viên.",
                android.R.drawable.ic_delete
            )
            409 -> Triple(
                "Đã điểm danh rồi",
                message + "\n\nMỗi sinh viên chỉ được điểm danh 1 lần cho mỗi sự kiện.",
                android.R.drawable.ic_dialog_info
            )
            else -> Triple(
                "Điểm danh thất bại",
                message,
                android.R.drawable.ic_dialog_alert
            )
        }
        
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(detailedMessage)
            .setIcon(icon)
            .setPositiveButton("Đóng") { _, _ ->
                finish()
            }
            .setNeutralButton("Về trang chủ") { _, _ ->
                navigateToHome()
            }
            .setCancelable(false)
            .show()
    }
}
