package com.attendance

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.attendance.api.ChangePasswordRequest
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityChangePasswordBinding
import com.attendance.utils.PreferenceManager
import kotlinx.coroutines.launch

/**
 * ChangePasswordActivity - Màn hình đổi mật khẩu
 * Hiển thị khi isFirstLogin = true hoặc user muốn đổi mật khẩu
 */
class ChangePasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityChangePasswordBinding
    private lateinit var prefManager: PreferenceManager
    private var isFirstLogin = false

    companion object {
        private const val TAG = "ChangePasswordActivity"
        const val EXTRA_IS_FIRST_LOGIN = "is_first_login"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "onCreate: Starting ChangePasswordActivity")

        binding = ActivityChangePasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefManager = PreferenceManager.getInstance(this)

        // Kiểm tra xem có phải lần đầu đăng nhập không
        isFirstLogin = intent.getBooleanExtra(EXTRA_IS_FIRST_LOGIN, false)

        if (isFirstLogin) {
            // Bắt buộc đổi mật khẩu nếu là lần đầu
            binding.tvMessage.text = "Đây là lần đầu đăng nhập. Vui lòng đổi mật khẩu để tiếp tục."
            binding.btnSkip.text = "Bỏ qua (Đổi sau)"
        } else {
            // Đổi mật khẩu tùy chọn
            binding.tvMessage.text = "Nhập mật khẩu cũ và mật khẩu mới để thay đổi."
            binding.btnSkip.text = "Hủy"
        }

        setupUI()
    }

    private fun setupUI() {
        binding.btnChangePassword.setOnClickListener {
            val oldPassword = binding.etOldPassword.text.toString().trim()
            val newPassword = binding.etNewPassword.text.toString().trim()
            val confirmPassword = binding.etConfirmPassword.text.toString().trim()

            if (validateInputs(oldPassword, newPassword, confirmPassword)) {
                changePassword(oldPassword, newPassword)
            }
        }

        binding.btnSkip.setOnClickListener {
            if (isFirstLogin) {
                // Cho phép bỏ qua lần đầu, nhưng sẽ yêu cầu đổi sau
                Toast.makeText(
                    this,
                    "Bạn nên đổi mật khẩu để bảo mật tài khoản",
                    Toast.LENGTH_LONG
                ).show()
            }
            navigateToHome()
        }
    }

    private fun validateInputs(oldPassword: String, newPassword: String, confirmPassword: String): Boolean {
        if (oldPassword.isEmpty()) {
            binding.tilOldPassword.error = "Vui lòng nhập mật khẩu cũ"
            return false
        }
        binding.tilOldPassword.error = null

        if (newPassword.isEmpty()) {
            binding.tilNewPassword.error = "Vui lòng nhập mật khẩu mới"
            return false
        }

        if (newPassword.length < 6) {
            binding.tilNewPassword.error = "Mật khẩu phải có ít nhất 6 ký tự"
            return false
        }
        binding.tilNewPassword.error = null

        if (confirmPassword != newPassword) {
            binding.tilConfirmPassword.error = "Mật khẩu xác nhận không khớp"
            return false
        }
        binding.tilConfirmPassword.error = null

        if (oldPassword == newPassword) {
            binding.tilNewPassword.error = "Mật khẩu mới phải khác mật khẩu cũ"
            return false
        }

        return true
    }

    private fun changePassword(oldPassword: String, newPassword: String) {
        Log.d(TAG, "changePassword: Starting password change")
        binding.btnChangePassword.isEnabled = false
        binding.btnChangePassword.text = "Đang xử lý..."
        binding.btnSkip.isEnabled = false

        lifecycleScope.launch {
            try {
                val request = ChangePasswordRequest(oldPassword, newPassword)
                val response = RetrofitClient.apiService.changePassword(request)

                Log.d(TAG, "changePassword: Response code = ${response.code()}")

                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(
                        this@ChangePasswordActivity,
                        "Đổi mật khẩu thành công!",
                        Toast.LENGTH_SHORT
                    ).show()

                    // Delay rồi chuyển màn hình
                    kotlinx.coroutines.delay(1000)
                    navigateToHome()
                } else {
                    val errorMsg = response.body()?.message ?: "Đổi mật khẩu thất bại"
                    Log.e(TAG, "changePassword: Error - $errorMsg")
                    Toast.makeText(
                        this@ChangePasswordActivity,
                        errorMsg,
                        Toast.LENGTH_SHORT
                    ).show()
                    resetButtons()
                }
            } catch (e: Exception) {
                Log.e(TAG, "changePassword: Exception", e)
                Toast.makeText(
                    this@ChangePasswordActivity,
                    "Lỗi kết nối: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
                resetButtons()
            }
        }
    }

    private fun resetButtons() {
        binding.btnChangePassword.isEnabled = true
        binding.btnChangePassword.text = "Đổi mật khẩu"
        binding.btnSkip.isEnabled = true
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    override fun onBackPressed() {
        if (isFirstLogin) {
            // Không cho back nếu là lần đầu đăng nhập
            Toast.makeText(
                this,
                "Vui lòng đổi mật khẩu hoặc bỏ qua",
                Toast.LENGTH_SHORT
            ).show()
        } else {
            super.onBackPressed()
        }
    }
}

