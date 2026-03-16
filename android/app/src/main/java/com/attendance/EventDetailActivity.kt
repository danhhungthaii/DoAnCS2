package com.attendance

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.attendance.BuildConfig
import com.attendance.api.Event
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityEventDetailBinding
import com.attendance.utils.CameraPreloader
import com.attendance.utils.GPSLocationCache
import com.attendance.utils.PreferenceManager
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class EventDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEventDetailBinding
    private lateinit var prefManager: PreferenceManager
    private var eventId: String = ""
    private var event: Event? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEventDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefManager = PreferenceManager.getInstance(this)
        eventId = intent.getStringExtra("eventId") ?: intent.getStringExtra("EVENT_ID") ?: ""

        setupToolbar()
        loadEventDetails()

        binding.btnRegister.setOnClickListener {
            registerForEvent()
        }
        
        // Workflow: Click "Điểm danh" → Mở ScanQRActivity để quét QR
        binding.btnCheckIn.setOnClickListener {
            openScanQR()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)
        binding.toolbar.setNavigationOnClickListener { onBackPressed() }
    }

    private fun loadEventDetails() {
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getEventById(eventId)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    event = response.body()?.data
                    updateUI(event)
                    
                    // Pre-load resources if event is ongoing
                    event?.let { evt ->
                        if (evt.status == "ongoing") {
                            prewarmResourcesForCheckIn(evt)
                        }
                    }
                } else {
                    Toast.makeText(this@EventDetailActivity, "Không thể tải thông tin sự kiện", Toast.LENGTH_SHORT).show()
                    finish()
                }
            } catch (e: Exception) {
                Toast.makeText(this@EventDetailActivity, "Lỗi: ${e.message}", Toast.LENGTH_SHORT).show()
                finish()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun updateUI(event: Event?) {
        if (event == null) return

        binding.apply {
            tvTitle.text = event.title
            tvDescription.text = event.description ?: "Không có mô tả"
            
            // Format DateTime - Separate Date and Time
            android.util.Log.d("EventDetail", "=== EVENT DATA ===")
            android.util.Log.d("EventDetail", "dateTime: '${event.dateTime}'")
            android.util.Log.d("EventDetail", "endDateTime: '${event.endDateTime}'")
            
            // Check if dateTime is null or empty
            if (event.dateTime.isNullOrEmpty()) {
                android.util.Log.e("EventDetail", " dateTime is null or empty!")
                tvDateTime.text = "Không có thông tin"
                tvTime.text = "Không có thông tin"
                tvDateTime.visibility = View.VISIBLE
                tvTime.visibility = View.VISIBLE
            } else {
                // Parse UTC time from backend and convert to local time
                try {
                    val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                    inputFormat.timeZone = java.util.TimeZone.getTimeZone("UTC") // Parse as UTC
                    
                    val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                    // dateFormat and timeFormat use local timezone by default
                    
                    val startDate = inputFormat.parse(event.dateTime)
                    android.util.Log.d("EventDetail", "Parsed startDate: $startDate")
                    
                    if (startDate != null) {
                        val formattedDate = dateFormat.format(startDate)
                        val startTime = timeFormat.format(startDate)
                        
                        // Parse end time if available
                        val endTimeStr = if (!event.endDateTime.isNullOrEmpty()) {
                            try {
                                val endDate = inputFormat.parse(event.endDateTime)
                                android.util.Log.d("EventDetail", "Parsed endDate: $endDate")
                                if (endDate != null) timeFormat.format(endDate) else "?"
                            } catch (e: Exception) {
                                android.util.Log.e("EventDetail", "Error parsing endDateTime: ${e.message}")
                                "?"
                            }
                        } else {
                            "?"
                        }
                        
                        tvDateTime.text = formattedDate
                        tvTime.text = "$startTime - $endTimeStr"
                        
                        android.util.Log.d("EventDetail", " SET tvDateTime.text = '$formattedDate'")
                        android.util.Log.d("EventDetail", " SET tvTime.text = '$startTime - $endTimeStr'")
                    } else {
                        android.util.Log.e("EventDetail", " Failed to parse startDate - returned null")
                        tvDateTime.text = event.dateTime
                        tvTime.text = event.endDateTime ?: "N/A"
                    }
                    
                    // Always ensure visibility
                    tvDateTime.visibility = View.VISIBLE
                    tvTime.visibility = View.VISIBLE
                    android.util.Log.d("EventDetail", " Set visibility to VISIBLE")
                    
                } catch (e: Exception) {
                    android.util.Log.e("EventDetail", " Exception parsing date: ${e.message}", e)
                    e.printStackTrace()
                    tvDateTime.text = event.dateTime
                    tvTime.text = event.endDateTime ?: "N/A"
                    tvDateTime.visibility = View.VISIBLE
                    tvTime.visibility = View.VISIBLE
                }
            }

            tvLocation.text = event.location.address
            
            // Load banner image using Glide
            if (!event.bannerUrl.isNullOrEmpty()) {
                // Check if URL is already absolute (external URLs like Picsum/Unsplash)
                val imageUrl = if (event.bannerUrl.startsWith("http://") || event.bannerUrl.startsWith("https://")) {
                    event.bannerUrl
                } else {
                    // Relative URL - prepend base URL
                    val baseUrl = BuildConfig.API_BASE_URL.replace("/api/", "")
                    baseUrl + event.bannerUrl
                }
                
                Glide.with(this@EventDetailActivity)
                    .load(imageUrl)
                    .transition(DrawableTransitionOptions.withCrossFade())
                    .centerCrop()
                    .signature(com.bumptech.glide.signature.ObjectKey(event.bannerUrl))
                    .into(ivEventImage)
            } else {
                ivEventImage.setColorFilter(Color.parseColor("#1E1E1E"))
            }
            
            // Registered badge
            tvRegisteredBadge.visibility =
                if (event.isRegistered == true) View.VISIBLE else View.GONE

            // Status badge - Use computed status
            val computedStatus = event.getComputedStatus()
            tvStatus.text = event.getStatusText()
            when (computedStatus) {
                "ongoing" -> {
                    tvStatus.setBackgroundResource(R.drawable.gradient_button)
                }
                "upcoming" -> {
                    tvStatus.setBackgroundResource(R.drawable.input_dark_background)
                }
                "completed" -> {
                    tvStatus.setBackgroundColor(Color.parseColor("#666666"))
                }
                "cancelled" -> {
                    tvStatus.setBackgroundColor(Color.parseColor("#666666"))
                }
            }

            // Button Logic - Use computed status for real-time updates
            when (computedStatus) {
                "ongoing" -> {
                    // Sự kiện đang diễn ra → Hiện nút "Điểm danh"
                    btnCheckIn.visibility = View.VISIBLE
                    btnCheckIn.isEnabled = true
                    btnCheckIn.text = "Điểm danh ngay"
                    btnCheckIn.alpha = 1.0f
                    btnRegister.visibility = View.GONE
                    
                    Log.d("EventDetail", " Event ongoing - Check-in button enabled")
                }
                "upcoming" -> {
                    // Sự kiện sắp diễn ra → Hiện nút disabled
                    btnCheckIn.visibility = View.VISIBLE
                    btnCheckIn.isEnabled = false
                    btnCheckIn.text = "Chưa đến giờ"
                    btnCheckIn.alpha = 0.5f
                    
                    // Hoặc hiện nút đăng ký nếu chưa đăng ký
                    if (event.isRegistered != true) {
                        btnRegister.visibility = View.VISIBLE
                    } else {
                        btnRegister.visibility = View.GONE
                    }
                    
                    Log.d("EventDetail", " Event upcoming - Check-in disabled")
                }
                "completed" -> {
                    // Sự kiện đã kết thúc → Ẩn nút
                    btnRegister.visibility = View.GONE
                    btnCheckIn.visibility = View.GONE
                    
                    Log.d("EventDetail", "✓ Event completed - Buttons hidden")
                }
                "cancelled" -> {
                    // Sự kiện đã hủy → Ẩn nút
                    btnRegister.visibility = View.GONE
                    btnCheckIn.visibility = View.GONE
                }
                else -> {
                    // Unknown status
                    btnRegister.visibility = View.GONE
                    btnCheckIn.visibility = View.GONE
                }
            }
            
        }
    }
    
    /**
     * Pre-warm resources for faster check-in
     * - Pre-load camera (2s → 0.2s)
     * - Pre-fetch GPS location
     * - Calculate distance and show feedback
     */
    private fun prewarmResourcesForCheckIn(event: Event) {
        android.util.Log.d("EventDetail", " Pre-warming resources for check-in...")
        
        // Pre-warm camera
        CameraPreloader.prewarmCamera(this)
        
        // Pre-fetch GPS location
        GPSLocationCache.fetchLocation(
            context = this,
            onSuccess = { location ->
                // Calculate distance
                val distance = GPSLocationCache.calculateDistance(
                    location.latitude, location.longitude,
                    event.location.coordinates.latitude,
                    event.location.coordinates.longitude
                )
                
                val formattedDistance = GPSLocationCache.formatDistance(distance)
                val isWithinRadius = distance <= event.checkInRadius
                
                android.util.Log.d("EventDetail", " Distance: $formattedDistance, Within radius: $isWithinRadius")
                
                // Show feedback banner
                runOnUiThread {
                    if (isWithinRadius) {
                        Toast.makeText(
                            this,
                            " Bạn đang ở vị trí hợp lệ ($formattedDistance). Sẵn sàng điểm danh!",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        Toast.makeText(
                            this,
                            " Bạn cách địa điểm $formattedDistance (yêu cầu < ${event.checkInRadius}m)",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            },
            onFailure = { error ->
                android.util.Log.w("EventDetail", " Failed to pre-fetch GPS: $error")
            }
        )
    }

    private fun openCheckInForm() {
        val currentEvent = event ?: return
        
        if (currentEvent.qrCode == null) {
            Toast.makeText(this, "️ Sự kiện chưa có mã QR", Toast.LENGTH_SHORT).show()
            return
        }
        
        val intent = Intent(this, CheckInFormActivity::class.java).apply {
            putExtra("EVENT_ID", currentEvent._id)
            putExtra("EVENT_TITLE", currentEvent.title)
            putExtra("QR_CODE", currentEvent.qrCode.code)
        }
        startActivity(intent)
    }

    private fun openScanQR() {
        val intent = Intent(this, ScanQRActivity::class.java)
        startActivity(intent)
    }

    private fun registerForEvent() {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnRegister.isEnabled = false

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.registerEvent(eventId)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@EventDetailActivity, "Đăng ký thành công!", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    val msg = response.body()?.message ?: response.errorBody()?.string() ?: response.message()
                    Toast.makeText(this@EventDetailActivity, "Lỗi: $msg", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@EventDetailActivity, "Lỗi kết nối: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnRegister.isEnabled = true
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Cleanup preloaded resources
        CameraPreloader.cleanup()
        GPSLocationCache.clearCache()
    }
}
