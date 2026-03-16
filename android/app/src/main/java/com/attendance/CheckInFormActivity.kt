package com.attendance

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityCheckInFormBinding
import com.attendance.utils.ImageCompressor
import com.attendance.utils.PreferenceManager
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream

class CheckInFormActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCheckInFormBinding
    private lateinit var prefManager: PreferenceManager
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    private var eventId: String = ""
    private var eventTitle: String = ""
    private var qrCode: String = ""
    private var latitude: Double = 0.0
    private var longitude: Double = 0.0
    private var photoUri: Uri? = null
    private var photoFile: File? = null

    private val cameraPermission = Manifest.permission.CAMERA
    private val locationPermission = Manifest.permission.ACCESS_FINE_LOCATION

    // Camera launcher
    private val cameraLauncher = registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success && photoUri != null) {
            displayPhotoPreview(photoUri!!)
            binding.btnSubmit.isEnabled = true
        }
    }

    // Gallery launcher
    private val galleryLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                photoUri = uri
                displayPhotoPreview(uri)
                binding.btnSubmit.isEnabled = true
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCheckInFormBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefManager = PreferenceManager.getInstance(this)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // Get data from Intent
        eventId = intent.getStringExtra("EVENT_ID") ?: ""
        eventTitle = intent.getStringExtra("EVENT_TITLE") ?: ""
        qrCode = intent.getStringExtra("QR_CODE") ?: ""

        if (eventId.isEmpty() || qrCode.isEmpty()) {
            Toast.makeText(this, " Dữ liệu không hợp lệ", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupToolbar()
        setupUI()
        getCurrentLocation()

        binding.btnTakePhoto.setOnClickListener { takePhoto() }
        binding.btnPickPhoto.setOnClickListener { pickFromGallery() }
        binding.btnSubmit.setOnClickListener { submitCheckIn() }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { onBackPressed() }
    }

    private fun setupUI() {
        binding.tvEventTitle.text = eventTitle
        
        val student = prefManager.getStudent()
        if (student == null) {
            android.util.Log.e("CheckInForm", " WARNING: No student data found in preferences!")
            androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Lỗi đăng nhập")
                .setMessage("Không tìm thấy thông tin sinh viên.\n\nVui lòng đăng xuất và đăng nhập lại.")
                .setCancelable(false)
                .setPositiveButton("Đăng xuất") { _, _ ->
                    prefManager.clearAll()
                    val intent = Intent(this, MainActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
                .show()
            return
        }
        
        android.util.Log.d("CheckInForm", " Student from preferences: ${student.fullName} (${student.studentCode})")
        android.util.Log.d("CheckInForm", "   Student ID: ${student.id}")
        
        binding.tvStudentInfo.text = "${student.studentCode} - ${student.fullName}"
    }

    private fun getCurrentLocation() {
        if (ContextCompat.checkSelfPermission(this, locationPermission) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(locationPermission), 100)
            return
        }

        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            if (location != null) {
                latitude = location.latitude
                longitude = location.longitude
                binding.tvGpsStatus.text = " Đã lấy vị trí thành công"
                binding.tvGpsStatusIcon.text = ""
            } else {
                binding.tvGpsStatus.text = "️ Không lấy được vị trí"
                binding.tvGpsStatusIcon.text = "️"
            }
        }.addOnFailureListener {
            binding.tvGpsStatus.text = " Lỗi GPS"
            binding.tvGpsStatusIcon.text = ""
        }
    }

    private fun takePhoto() {
        if (ContextCompat.checkSelfPermission(this, cameraPermission) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(cameraPermission), 101)
            return
        }

        photoFile = File(cacheDir, "check_in_photo_${System.currentTimeMillis()}.jpg")
        photoUri = FileProvider.getUriForFile(this, "${packageName}.provider", photoFile!!)
        cameraLauncher.launch(photoUri)
    }

    private fun pickFromGallery() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        galleryLauncher.launch(intent)
    }

    private fun displayPhotoPreview(uri: Uri) {
        binding.cardPhotoPreview.visibility = View.VISIBLE
        binding.ivPhotoPreview.setImageURI(uri)
    }

    private fun submitCheckIn() {
        if (photoUri == null) {
            Toast.makeText(this, " Vui lòng chọn ảnh", Toast.LENGTH_SHORT).show()
            return
        }

        if (latitude == 0.0 || longitude == 0.0) {
            Toast.makeText(this, "⚠ Chưa có vị trí GPS, đang thử lại...", Toast.LENGTH_SHORT).show()
            getCurrentLocation()
            return
        }

        binding.progressBar.visibility = View.VISIBLE
        binding.btnSubmit.isEnabled = false

        lifecycleScope.launch {
            try {
                // Prepare file
                val file = prepareImageFile(photoUri!!)
                if (file == null) {
                    Toast.makeText(this@CheckInFormActivity, " Không thể xử lý ảnh", Toast.LENGTH_SHORT).show()
                    binding.progressBar.visibility = View.GONE
                    binding.btnSubmit.isEnabled = true
                    return@launch
                }

                val requestBody = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
                val photoPart = MultipartBody.Part.createFormData("evidencePhoto", file.name, requestBody)

                val student = prefManager.getStudent()
                val studentId = student?.id ?: ""
                
                // Enhanced logging for debugging
                android.util.Log.d("CheckInForm", " Preparing check-in request:")
                android.util.Log.d("CheckInForm", "   Student from prefs: ${student?.fullName} (${student?.studentCode})")
                android.util.Log.d("CheckInForm", "   Student ID: '$studentId'")
                android.util.Log.d("CheckInForm", "   Event ID: '$eventId'")
                android.util.Log.d("CheckInForm", "   QR Code: '$qrCode'")
                android.util.Log.d("CheckInForm", "   Location: $latitude, $longitude")
                
                if (studentId.isEmpty()) {
                    Toast.makeText(this@CheckInFormActivity, " Lỗi: Chưa đăng nhập hoặc thiếu thông tin sinh viên", Toast.LENGTH_LONG).show()
                    binding.progressBar.visibility = View.GONE
                    binding.btnSubmit.isEnabled = true
                    return@launch
                }

                // Prepare other fields
                val eventIdBody = eventId.toRequestBody("text/plain".toMediaTypeOrNull())
                val studentIdBody = studentId.toRequestBody("text/plain".toMediaTypeOrNull())
                val qrCodeBody = qrCode.toRequestBody("text/plain".toMediaTypeOrNull())
                val latBody = latitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                val lonBody = longitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())

                val response = RetrofitClient.apiService.checkInWithPhoto(
                    eventIdBody, studentIdBody, qrCodeBody, latBody, lonBody, photoPart
                )
                
                android.util.Log.d("CheckInForm", " Response code: ${response.code()}")

                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@CheckInFormActivity, " Check-in thành công! Đang chờ xác nhận", Toast.LENGTH_LONG).show()
                    
                    // Navigate to result or go back
                    val intent = Intent(this@CheckInFormActivity, CheckInResultActivity::class.java).apply {
                        putExtra("SUCCESS", true)
                        putExtra("MESSAGE", "Check-in của bạn đang chờ admin xác nhận. Bạn sẽ nhận được điểm sau khi được duyệt.")
                    }
                    startActivity(intent)
                    finish()
                } else {
                    // Enhanced error handling
                    val statusCode = response.code()
                    val errorMsg = response.body()?.message 
                        ?: try { 
                            org.json.JSONObject(response.errorBody()?.string() ?: "{}").optString("message", "Lỗi không xác định")
                        } catch (e: Exception) { "Lỗi không xác định" }
                    
                    showErrorDialog(statusCode, errorMsg)
                }
            } catch (e: Exception) {
                Toast.makeText(this@CheckInFormActivity, " Lỗi: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnSubmit.isEnabled = true
            }
        }
    }

    private fun showErrorDialog(statusCode: Int, message: String) {
        val (title, detailedMessage) = when (statusCode) {
            403 -> Pair(
                "Ngoài khu vực cho phép",
                "$message\n\nVui lòng di chuyển đến gần địa điểm sự kiện hơn để điểm danh."
            )
            404 -> Pair(
                "Không tìm thấy sinh viên",
                "Dữ liệu sinh viên đã hết hạn hoặc không tồn tại.\n\nVui lòng đăng xuất và đăng nhập lại."
            )
            409 -> Pair(
                "Đã điểm danh rồi",
                "Bạn đã điểm danh cho sự kiện này trước đó."
            )
            400 -> Pair(
                "Thông tin không hợp lệ",
                message
            )
            else -> Pair(
                "Điểm danh thất bại",
                message
            )
        }
        
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(detailedMessage)
            .setIcon(android.R.drawable.ic_dialog_alert)
        
        // Nếu 404 (student not found), thêm nút logout
        if (statusCode == 404) {
            builder
                .setPositiveButton("Đăng xuất ngay") { _, _ ->
                    prefManager.clearAll()
                    val intent = Intent(this, MainActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
                .setNegativeButton("Đóng", null)
                .setCancelable(false)
        } else {
            builder.setPositiveButton("Đóng") { _, _ ->
                // Stay on current screen, allow retry
            }
        }
        
        builder.show()
    }

    private fun prepareImageFile(uri: Uri): File? {
        return try {
            // Sử dụng ImageCompressor utility (tối ưu hơn)
            // Giảm kích thước từ 4-5MB → 200-400KB
            // Upload time: 10s → 1-2s
            val compressedFile = ImageCompressor.compressImage(this, uri)
            
            if (compressedFile != null) {
                val originalSize = try {
                    contentResolver.openInputStream(uri)?.available()?.toLong() ?: 0L
                } catch (e: Exception) { 0L }
                
                val compressedSize = compressedFile.length()
                val reduction = if (originalSize > 0) {
                    ((originalSize - compressedSize) * 100 / originalSize)
                } else 0
                
                android.util.Log.d("CheckInForm", 
                    "📸 Image compressed: ${ImageCompressor.formatFileSize(originalSize)} → ${ImageCompressor.formatFileSize(compressedSize)} (giảm $reduction%)")
            }
            
            compressedFile
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            100 -> if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                getCurrentLocation()
            }
            101 -> if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                takePhoto()
            }
        }
    }
}
