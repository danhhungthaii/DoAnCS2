package com.attendance

import android.content.Intent
import android.os.Bundle
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
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            binding = ActivityEventListBinding.inflate(layoutInflater)
            setContentView(binding.root)

            prefManager = PreferenceManager(this)

            // Kiểm tra xem người dùng đã đăng nhập chưa
            if (!prefManager.isLoggedIn()) {
                Toast.makeText(this, "Vui lòng đăng nhập lại", Toast.LENGTH_SHORT).show()
                navigateToLogin()
                return
            }

            setupUI()
            loadEvents()
        } catch (e: Exception) {
            Toast.makeText(this, "Lỗi khởi tạo: ${e.message}", Toast.LENGTH_LONG).show()
            e.printStackTrace()
            navigateToLogin()
        }
    }

    private fun navigateToLogin() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
    
    private fun setupUI() {
        try {
            val student = prefManager.getStudent()
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

            // Refresh
            binding.swipeRefresh.setOnRefreshListener {
                loadEvents()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Lỗi khởi tạo giao diện: ${e.message}", Toast.LENGTH_LONG).show()
            e.printStackTrace()
        }
    }
    
    private fun loadEvents() {
        binding.swipeRefresh.isRefreshing = true
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                // Lấy sự kiện đang diễn ra và sắp tới
                val response = RetrofitClient.apiService.getEvents(status = null)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val events = response.body()?.data ?: emptyList()
                    
                    if (events.isEmpty()) {
                        binding.tvEmptyState.visibility = View.VISIBLE
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
        // Chuyển sang màn hình scan QR
        val intent = Intent(this, ScanQRActivity::class.java).apply {
            putExtra("EVENT_ID", event.id)
            putExtra("EVENT_TITLE", event.title)
            putExtra("EVENT_LATITUDE", event.location.coordinates.latitude)
            putExtra("EVENT_LONGITUDE", event.location.coordinates.longitude)
            putExtra("EVENT_RADIUS", event.checkInRadius)
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
