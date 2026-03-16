package com.attendance

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityMainBinding
import com.attendance.utils.ApiTestHelper
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
        private const val TAG = "MainActivity"
        private const val PERMISSION_REQUEST_CODE = 100
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "onCreate: Starting MainActivity")

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        prefManager = PreferenceManager.getInstance(this)
        
        // Load token nếu đã đăng nhập
        val savedToken = prefManager.getAuthToken()
        if (savedToken != null) {
            Log.d(TAG, "onCreate: Loading saved token")
            RetrofitClient.setAuthToken(savedToken)
        }

        // Check đã login chưa
        val isLoggedIn = prefManager.isLoggedIn()
        Log.d(TAG, "onCreate: isLoggedIn = $isLoggedIn")

        if (isLoggedIn) {
            Log.d(TAG, "onCreate: User already logged in, navigating to Home")
            navigateToHome()
            return
        }
        
        setupUI()
        checkPermissions()

        // Hiển thị API URL để user biết đang kết nối đến đâu
        Log.d(TAG, "onCreate: API Base URL = ${RetrofitClient.getBaseUrl()}")

        // Test kết nối API ngay khi khởi động (optional)
        testApiConnection()
    }

    /**
     * Test kết nối với backend API
     */
    private fun testApiConnection() {
        lifecycleScope.launch {
            try {
                val result = ApiTestHelper.testConnection()
                when (result) {
                    is ApiTestHelper.TestResult.Success -> {
                        Log.d(TAG, "API Connection Test: ${result.message}")
                        // Có thể hiển thị toast nếu muốn
                        // Toast.makeText(this@MainActivity, result.message, Toast.LENGTH_SHORT).show()
                    }
                    is ApiTestHelper.TestResult.Error -> {
                        Log.w(TAG, "API Connection Test Failed: ${result.message}")
                        // Hiển thị cảnh báo cho user
                        Toast.makeText(
                            this@MainActivity,
                            " Cảnh báo: Không kết nối được backend. Kiểm tra server!",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "testApiConnection: Error", e)
            }
        }
    }
    
    private fun setupUI() {
        binding.btnLogin.setOnClickListener {
            val studentCode = binding.etStudentCode.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()

            if (studentCode.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập mã sinh viên", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            if (password.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập mật khẩu", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            login(studentCode, password)
        }
    }
    
    private fun login(studentCode: String, password: String) {
        Log.d(TAG, "login: Attempting login with studentCode = $studentCode")
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

                Log.d(TAG, "login: Device ID = $deviceId")

                // Gọi API student login
                Log.d(TAG, "login: Calling API studentLogin")
                val loginRequest = com.attendance.api.LoginRequest(studentCode, password, deviceId)
                val response = RetrofitClient.apiService.studentLogin(loginRequest)
                Log.d(TAG, "login: API response code = ${response.code()}, success = ${response.isSuccessful}")

                if (response.isSuccessful && response.body()?.success == true) {
                    val body = response.body()
                    val student = body?.data
                    val token = body?.token
                    val isFirstLogin = body?.isFirstLogin ?: false

                    Log.d(TAG, "login: Student found - ${student?.fullName}")
                    Log.d(TAG, "login: Token received = ${token != null}")
                    Log.d(TAG, "login: isFirstLogin = $isFirstLogin")

                    if (student != null) {
                        // Lưu token vào RetrofitClient
                        if (token != null) {
                            RetrofitClient.setAuthToken(token)
                        }

                        // Lưu thông tin đăng nhập
                        Log.d(TAG, "login: Saving student data")
                        prefManager.saveStudent(student, deviceId, token)

                        Toast.makeText(
                            this@MainActivity,
                            "Đăng nhập thành công! Chào ${student.fullName}",
                            Toast.LENGTH_SHORT
                        ).show()
                        
                        // Delay để đảm bảo data đã lưu xong
                        kotlinx.coroutines.delay(1000)

                        // Kiểm tra lại xem đã lưu thành công chưa
                        val savedSuccessfully = prefManager.isLoggedIn()
                        Log.d(TAG, "login: Data saved successfully = $savedSuccessfully")

                        if (savedSuccessfully) {
                            // Kiểm tra xem có phải lần đầu đăng nhập không
                            if (isFirstLogin) {
                                Log.d(TAG, "login: First login detected, navigating to ChangePassword")
                                navigateToChangePassword(true)
                            } else {
                                navigateToHome()
                            }
                        } else {
                            Toast.makeText(
                                this@MainActivity,
                                "Lỗi lưu thông tin đăng nhập. Vui lòng thử lại",
                                Toast.LENGTH_LONG
                            ).show()
                            resetLoginButton()
                        }
                    } else {
                        Log.w(TAG, "login: Student data is null")
                        Toast.makeText(
                            this@MainActivity,
                            "Không tìm thấy thông tin sinh viên",
                            Toast.LENGTH_SHORT
                        ).show()
                        resetLoginButton()
                    }
                } else {
                    val errorMsg = response.body()?.message ?: response.message()
                    val statusCode = response.code()
                    Log.e(TAG, "login: API call failed - Status: $statusCode, Message: $errorMsg")
                    
                    // Hiển thị thông báo chi tiết dựa vào status code
                    val (title, message) = when (statusCode) {
                        403 -> Pair(
                            "Thiết bị không được phép",
                            "Thiết bị này không được phép đăng nhập vào tài khoản này.\n\n" +
                            "Có thể tài khoản đã đăng nhập trên thiết bị khác.\n\n" +
                            "Vui lòng liên hệ quản trị viên để được hỗ trợ."
                        )
                        401 -> Pair(
                            "Sai mật khẩu",
                            "Mật khẩu không đúng.\n\nVui lòng kiểm tra và thử lại."
                        )
                        404 -> Pair(
                            "Mã sinh viên không tồn tại",
                            "Không tìm thấy sinh viên với mã: $studentCode\n\n" +
                            "Vui lòng kiểm tra lại mã sinh viên."
                        )
                        400 -> Pair(
                            "Thông tin không hợp lệ",
                            errorMsg
                        )
                        else -> Pair(
                            "Đăng nhập thất bại",
                            errorMsg
                        )
                    }
                    
                    // Hiển thị dialog thay vì toast
                    androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                        .setTitle(title)
                        .setMessage(message)
                        .setIcon(android.R.drawable.ic_dialog_alert)
                        .setPositiveButton("Đóng") { dialog, _ -> 
                            dialog.dismiss()
                        }
                        .apply {
                            // Nếu là lỗi 403 (device không hợp lệ), thêm nút "Liên hệ Admin"
                            if (statusCode == 403) {
                                setNeutralButton("Liên hệ Admin") { _, _ ->
                                    Toast.makeText(
                                        this@MainActivity,
                                        "Vui lòng liên hệ quản trị viên qua email hoặc hotline",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                            }
                        }
                        .show()
                    
                    resetLoginButton()
                }
            } catch (e: Exception) {
                Log.e(TAG, "login: Exception occurred", e)
                
                // Phân loại lỗi để hiển thị thông báo rõ ràng
                val (title, message) = when {
                    e is java.net.UnknownHostException -> Pair(
                        "Không thể kết nối",
                        "Không thể kết nối đến máy chủ.\n\n" +
                        "Vui lòng kiểm tra:\n" +
                        "• Kết nối Internet\n" +
                        "• Máy chủ backend đang chạy\n" +
                        "• URL API đúng"
                    )
                    e is java.net.SocketTimeoutException -> Pair(
                        "Quá thời gian chờ",
                        "Kết nối đến máy chủ quá lâu.\n\n" +
                        "Vui lòng thử lại hoặc kiểm tra kết nối mạng."
                    )
                    e is java.net.ConnectException -> Pair(
                        "Lỗi kết nối",
                        "Không thể kết nối đến máy chủ.\n\n" +
                        "Backend có thể chưa được khởi động.\n" +
                        "Vui lòng liên hệ quản trị viên."
                    )
                    e.message?.contains("Failed to connect", ignoreCase = true) == true -> Pair(
                        "Kết nối thất bại",
                        "Không thể kết nối đến máy chủ.\n\n" +
                        "Vui lòng kiểm tra kết nối Internet và thử lại."
                    )
                    else -> Pair(
                        "Lỗi không xác định",
                        "Đã xảy ra lỗi: ${e.message ?: "Unknown error"}\n\n" +
                        "Vui lòng thử lại hoặc liên hệ quản trị viên."
                    )
                }
                
                androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                    .setTitle(title)
                    .setMessage(message)
                    .setIcon(android.R.drawable.ic_dialog_alert)
                    .setPositiveButton("Đóng") { dialog, _ -> 
                        dialog.dismiss()
                    }
                    .setNeutralButton("Thử lại") { _, _ ->
                        login(studentCode, password)
                    }
                    .show()
                
                e.printStackTrace()
                resetLoginButton()
            }
        }
    }

    private fun resetLoginButton() {
        binding.btnLogin.isEnabled = true
        binding.btnLogin.text = "Đăng nhập"
    }
    
    private fun navigateToChangePassword(isFirstLogin: Boolean) {
        try {
            Log.d(TAG, "navigateToChangePassword: Starting navigation (isFirstLogin=$isFirstLogin)")
            val intent = Intent(this, ChangePasswordActivity::class.java)
            intent.putExtra(ChangePasswordActivity.EXTRA_IS_FIRST_LOGIN, isFirstLogin)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            Log.d(TAG, "navigateToChangePassword: Activity started, finishing MainActivity")
            finish()
        } catch (e: Exception) {
            Log.e(TAG, "navigateToChangePassword: Exception occurred", e)
            Toast.makeText(
                this,
                "Lỗi khi chuyển màn hình: ${e.message}",
                Toast.LENGTH_LONG
            ).show()
            resetLoginButton()
        }
    }

    private fun navigateToHome() {
        try {
            Log.d(TAG, "navigateToHome: Starting navigation")

            // Verify student data exists
            val student = prefManager.getStudent()
            Log.d(TAG, "navigateToHome: Student = ${student?.fullName ?: "null"}")

            if (student == null) {
                Log.e(TAG, "navigateToHome: Student data is null!")
                Toast.makeText(
                    this,
                    "Lỗi: Không tìm thấy thông tin sinh viên. Vui lòng đăng nhập lại",
                    Toast.LENGTH_LONG
                ).show()
                resetLoginButton()
                return
            }

            Log.d(TAG, "navigateToHome: Creating intent for HomeActivity")
            val intent = Intent(this, HomeActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            Log.d(TAG, "navigateToHome: Activity started, finishing MainActivity")
            finish()
        } catch (e: Exception) {
            Log.e(TAG, "navigateToHome: Exception occurred", e)
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
