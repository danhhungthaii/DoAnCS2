package com.attendance

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityMainBinding
import com.attendance.utils.PreferenceManager
import kotlinx.coroutines.launch

/**
 * MainActivity - Màn hình Login
 * Sinh viên nhập MSSV để đăng nhập
 */
class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var prefManager: PreferenceManager
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        prefManager = PreferenceManager(this)
        
        // Check đã login chưa
        if (prefManager.isLoggedIn()) {
            navigateToEventList()
            return
        }
        
        setupUI()
        checkPermissions()
    }
    
    private fun setupUI() {
        binding.btnLogin.setOnClickListener {
            val studentCode = binding.etStudentCode.text.toString().trim()
            
            if (studentCode.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập mã sinh viên", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            login(studentCode)
        }
    }
    
    private fun login(studentCode: String) {
        binding.btnLogin.isEnabled = false
        binding.btnLogin.text = "Đang đăng nhập..."
        
        lifecycleScope.launch {
            try {
                // Lấy Device ID
                val deviceId = try {
                    Settings.Secure.getString(
                        contentResolver,
                        Settings.Secure.ANDROID_ID
                    ) ?: "unknown"
                } catch (e: Exception) {
                    "unknown"
                }

                // Tìm sinh viên theo mã SV
                val response = RetrofitClient.apiService.findStudent(studentCode)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val students = response.body()?.data
                    val student = students?.firstOrNull { 
                        it.studentCode.equals(studentCode, ignoreCase = true) 
                    }
                    
                    if (student != null) {
                        // Lưu thông tin đăng nhập với async/await để đảm bảo hoàn tất
                        prefManager.saveStudentAsync(student, deviceId)
                        
                        // Xác nhận session đã được lưu
                        if (prefManager.isLoggedIn()) {
                            Toast.makeText(
                                this@MainActivity,
                                "Đăng nhập thành công! Chào ${student.fullName}",
                                Toast.LENGTH_SHORT
                            ).show()
                            
                            // Delay nhỏ để Toast hiển thị
                            kotlinx.coroutines.delay(500)
                            navigateToEventList()
                        } else {
                            Toast.makeText(
                                this@MainActivity,
                                "Lỗi lưu phiên đăng nhập. Vui lòng thử lại.",
                                Toast.LENGTH_LONG
                            ).show()
                            resetLoginButton()
                        }
                    } else {
                        Toast.makeText(
                            this@MainActivity,
                            "Không tìm thấy sinh viên với mã $studentCode",
                            Toast.LENGTH_SHORT
                        ).show()
                        resetLoginButton()
                    }
                } else {
                    Toast.makeText(
                        this@MainActivity,
                        "Lỗi: ${response.body()?.message ?: response.message()}",
                        Toast.LENGTH_SHORT
                    ).show()
                    resetLoginButton()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@MainActivity,
                    "Lỗi kết nối: ${e.message}",
                    Toast.LENGTH_LONG
                ).show()
                e.printStackTrace()
                resetLoginButton()
            }
        }
    }

    private fun resetLoginButton() {
        binding.btnLogin.isEnabled = true
        binding.btnLogin.text = "Đăng nhập"
    }
    
    private fun navigateToEventList() {
        try {
            val intent = Intent(this, EventListActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        } catch (e: Exception) {
            Toast.makeText(
                this,
                "Lỗi khi chuyển màn hình: ${e.message}",
                Toast.LENGTH_LONG
            ).show()
            e.printStackTrace()
            resetLoginButton()
        }
    }
    
    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        
        val notGranted = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (notGranted.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                notGranted.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            if (!allGranted) {
                Toast.makeText(
                    this,
                    "Vui lòng cấp quyền Camera và GPS để sử dụng app",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }
}
