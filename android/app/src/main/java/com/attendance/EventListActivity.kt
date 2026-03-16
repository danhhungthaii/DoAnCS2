package com.attendance

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.attendance.adapters.EventAdapter
import com.attendance.api.Event
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityEventListBinding
import com.attendance.utils.PreferenceManager
import kotlinx.coroutines.launch

/**
 * EventListActivity - Danh sách sự kiện
 * Hiển thị các sự kiện sinh viên có thể check-in
 */
class EventListActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityEventListBinding
    private lateinit var prefManager: PreferenceManager
    private lateinit var eventAdapter: EventAdapter
    
    companion object {
        private const val TAG = "EventListActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "onCreate: Starting EventListActivity")

        try {
            binding = ActivityEventListBinding.inflate(layoutInflater)
            setContentView(binding.root)
            Log.d(TAG, "onCreate: View binding created successfully")

            prefManager = PreferenceManager.getInstance(this)

            // Load token
            val savedToken = prefManager.getAuthToken()
            if (savedToken != null) {
                Log.d(TAG, "onCreate: Loading saved token")
                RetrofitClient.setAuthToken(savedToken)
            } else {
                Log.w(TAG, "onCreate: No token found")
            }

            // Kiểm tra xem người dùng đã đăng nhập chưa
            val isLoggedIn = prefManager.isLoggedIn()
            Log.d(TAG, "onCreate: isLoggedIn = $isLoggedIn")

            if (!isLoggedIn) {
                Log.w(TAG, "onCreate: User not logged in, redirecting to login")
                Toast.makeText(this, "Vui lòng đăng nhập lại", Toast.LENGTH_SHORT).show()
                navigateToLogin()
                return
            }

            // Kiểm tra xem có thông tin sinh viên không
            val student = prefManager.getStudent()
            Log.d(TAG, "onCreate: Student = ${student?.fullName ?: "null"}")

            if (student == null) {
                Log.e(TAG, "onCreate: Student data is null despite being logged in!")
                Toast.makeText(
                    this,
                    "Không tìm thấy thông tin sinh viên. Vui lòng đăng nhập lại",
                    Toast.LENGTH_LONG
                ).show()
                prefManager.clearSession()
                navigateToLogin()
                return
            }

            Log.d(TAG, "onCreate: Setting up UI")
            setupUI()
            
            // Check if we need to filter by status (from HomeFragment)
            val filterStatus = intent.getStringExtra("FILTER_STATUS")
            if (filterStatus != null) {
                val tabIndex = when (filterStatus) {
                    "ongoing" -> 0
                    "upcoming" -> 1
                    "completed" -> 2
                    else -> 0
                }
                binding.tabLayout.getTabAt(tabIndex)?.select()
            }
            
            Log.d(TAG, "onCreate: Loading events")
            loadEvents()
        } catch (e: Exception) {
            Log.e(TAG, "onCreate: Exception occurred", e)
            Toast.makeText(this, "Lỗi khởi tạo: ${e.message}", Toast.LENGTH_LONG).show()
            e.printStackTrace()
            prefManager.clearSession()
            navigateToLogin()
        }
    }

    private fun navigateToLogin() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    private fun setupUI() {
        try {
            val student = prefManager.getStudent()
            Log.d(TAG, "setupUI: Setting welcome text for ${student?.fullName}")

            binding.tvWelcome.text = "Xin chào, ${student?.fullName ?: "Sinh viên"}"
            binding.tvStudentCode.text = "MSSV: ${student?.studentCode ?: "N/A"}"

            // Setup toolbar
            setSupportActionBar(binding.toolbar)

            // Setup RecyclerView
            eventAdapter = EventAdapter { event ->
                onEventClick(event)
            }
            binding.rvEvents.apply {
                layoutManager = LinearLayoutManager(this@EventListActivity)
                adapter = eventAdapter
            }

            // Setup Tabs
            setupTabs()

            // Refresh
            binding.swipeRefresh.setOnRefreshListener {
                loadEvents()
            }

            Log.d(TAG, "setupUI: UI setup completed successfully")
        } catch (e: Exception) {
            Log.e(TAG, "setupUI: Exception occurred", e)
            Toast.makeText(this, "Lỗi khởi tạo giao diện: ${e.message}", Toast.LENGTH_LONG).show()
            e.printStackTrace()
        }
    }

    private fun setupTabs() {
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Đang diễn ra"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Sắp diễn ra"))
        binding.tabLayout.addTab(binding.tabLayout.newTab().setText("Đã kết thúc"))

        binding.tabLayout.addOnTabSelectedListener(object : com.google.android.material.tabs.TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: com.google.android.material.tabs.TabLayout.Tab?) {
                loadEvents()
            }
            override fun onTabUnselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
            override fun onTabReselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
        })
    }
    
    private fun loadEvents() {
        binding.swipeRefresh.isRefreshing = true
        binding.progressBar.visibility = View.VISIBLE
        
        // Map tab index to status
        val status = when (binding.tabLayout.selectedTabPosition) {
            0 -> "ongoing"
            1 -> "upcoming"
            2 -> "completed"
            else -> "ongoing"
        }

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getEvents(status = status)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val events = response.body()?.data ?: emptyList()
                    
                    if (events.isEmpty()) {
                        binding.tvEmptyState.visibility = View.VISIBLE
                        binding.tvEmptyState.text = "Không có sự kiện nào"
                        binding.rvEvents.visibility = View.GONE
                    } else {
                        binding.tvEmptyState.visibility = View.GONE
                        binding.rvEvents.visibility = View.VISIBLE
                        eventAdapter.submitList(events)
                    }
                } else {
                    Toast.makeText(
                        this@EventListActivity,
                        "Không thể tải danh sách sự kiện",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@EventListActivity,
                    "Lỗi: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
                e.printStackTrace()
            } finally {
                binding.swipeRefresh.isRefreshing = false
                binding.progressBar.visibility = View.GONE
            }
        }
    }
    
    private fun onEventClick(event: Event) {
        // Chuyển sang màn hình chi tiết sự kiện
        val intent = Intent(this, EventDetailActivity::class.java).apply {
            putExtra("EVENT_ID", event._id)
            putExtra("EVENT_TITLE", event.title)
        }
        startActivity(intent)
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_event_list, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_logout -> {
                prefManager.clearSession()
                startActivity(Intent(this, MainActivity::class.java))
                finish()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}
