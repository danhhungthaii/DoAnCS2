package com.attendance.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.attendance.ChangePasswordActivity
import com.attendance.MainActivity
import com.attendance.api.RetrofitClient
import com.attendance.databinding.FragmentSettingsBinding
import com.attendance.utils.PreferenceManager

/**
 * SettingsFragment - App settings and logout
 */
class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var prefManager: PreferenceManager

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        prefManager = PreferenceManager.getInstance(requireContext())
        
        displayUserInfo()
        setupClickListeners()
    }

    private fun displayUserInfo() {
        val studentCode = prefManager.getStudentCode()
        val fullName = prefManager.getFullName()
        
        binding.tvUserName.text = fullName ?: "Sinh viên"
        binding.tvUserCode.text = studentCode ?: "-"
    }

    private fun setupClickListeners() {
        // Change Password
        binding.layoutChangePassword.setOnClickListener {
            startActivity(Intent(requireContext(), ChangePasswordActivity::class.java))
        }
        
        // API Server Info
        binding.layoutApiServer.setOnClickListener {
            val apiUrl = RetrofitClient.getBaseUrl()
            AlertDialog.Builder(requireContext())
                .setTitle("Thông tin Server")
                .setMessage("API URL:\n$apiUrl")
                .setPositiveButton("OK", null)
                .show()
        }
        
        // About App
        binding.layoutAbout.setOnClickListener {
            AlertDialog.Builder(requireContext())
                .setTitle("Về ứng dụng")
                .setMessage("Ứng dụng Điểm danh QR Code\nVersion 1.0.0\n\nPhát triển bởi Team Dev")
                .setPositiveButton("OK", null)
                .show()
        }
        
        // Logout
        binding.btnLogout.setOnClickListener {
            showLogoutConfirmation()
        }
    }

    private fun showLogoutConfirmation() {
        AlertDialog.Builder(requireContext())
            .setTitle("Đăng xuất")
            .setMessage("Bạn có chắc chắn muốn đăng xuất?")
            .setPositiveButton("Đăng xuất") { _, _ ->
                performLogout()
            }
            .setNegativeButton("Hủy", null)
            .show()
    }

    private fun performLogout() {
        // Clear preferences
        prefManager.clearAll()
        
        // Clear token
        RetrofitClient.setAuthToken(null)
        
        // Navigate to login
        val intent = Intent(requireContext(), MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        requireActivity().finish()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
