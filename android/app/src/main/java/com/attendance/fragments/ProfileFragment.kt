package com.attendance.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.attendance.ChangePasswordActivity
import com.attendance.api.RetrofitClient
import com.attendance.databinding.FragmentProfileBinding
import com.attendance.utils.PreferenceManager
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var prefManager: PreferenceManager

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        prefManager = PreferenceManager.getInstance(requireContext())
        
        loadStudentInfo()
        loadAttendanceStats()
        
        binding.btnChangePassword.setOnClickListener {
            startActivity(Intent(requireContext(), ChangePasswordActivity::class.java))
        }
        
        binding.swipeRefresh.setOnRefreshListener {
            loadStudentInfo()
            loadAttendanceStats()
        }
    }

    private fun loadStudentInfo() {
        if (_binding == null) return
        binding.progressBar.visibility = View.VISIBLE
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                android.util.Log.d("ProfileFragment", "Loading student profile...")
                val response = RetrofitClient.apiService.getStudentProfile()
                
                android.util.Log.d("ProfileFragment", "Response: ${response.code()}, Success: ${response.isSuccessful}")
                
                if (_binding == null) return@launch
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val student = response.body()?.data
                    android.util.Log.d("ProfileFragment", "Student data loaded: ${student?.fullName}")
                    
                    binding.apply {
                        tvStudentCode.text = student?.studentCode ?: "-"
                        tvFullName.text = student?.fullName ?: "-"
                        tvEmail.text = student?.email ?: "-"
                        tvPhone.text = student?.phone ?: "-"
                        tvClass.text = student?.classInfo ?: "-"
                        tvMajor.text = student?.major ?: "-"
                        
                        val firstLetter = student?.fullName?.firstOrNull()?.toString()?.uppercase() ?: "?"
                        tvAvatarLetter.text = firstLetter
                    }
                } else {
                    val errorMsg = response.body()?.message ?: "Không thể tải thông tin"
                    android.util.Log.e("ProfileFragment", "Error: $errorMsg")
                    Toast.makeText(requireContext(), errorMsg, Toast.LENGTH_SHORT).show()
                }
            } catch (e: CancellationException) {
                // Fragment destroyed - ignore
                android.util.Log.d("ProfileFragment", "Request cancelled")
            } catch (e: Exception) {
                android.util.Log.e("ProfileFragment", "Exception: ${e.message}", e)
                if (_binding != null && isAdded) {
                    Toast.makeText(requireContext(), "Lỗi: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            } finally {
                if (_binding != null) {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                }
            }
        }
    }

    private fun loadAttendanceStats() {
        if (_binding == null) return
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getAttendanceHistory()
                
                if (_binding == null) return@launch
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val attendances = response.body()?.data ?: emptyList()
                    
                    binding.tvTotalAttendance.text = attendances.size.toString()
                    
                    val calendar = Calendar.getInstance()
                    val currentMonth = calendar.get(Calendar.MONTH)
                    val currentYear = calendar.get(Calendar.YEAR)
                    
                    val thisMonthCount = attendances.count { attendance ->
                        try {
                            val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                                .parse(attendance.checkInTime)
                            if (date != null) {
                                calendar.time = date
                                calendar.get(Calendar.MONTH) == currentMonth &&
                                calendar.get(Calendar.YEAR) == currentYear
                            } else false
                        } catch (e: Exception) {
                            false
                        }
                    }
                    
                    binding.tvThisMonthAttendance.text = thisMonthCount.toString()
                }
            } catch (e: CancellationException) {
                // ignore
            } catch (e: Exception) {
                // Silent fail for stats
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
