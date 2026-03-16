package com.attendance

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.attendance.api.EventRegistration
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityHistoryBinding
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class HistoryActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHistoryBinding
    private val registeredAdapter = RegistrationHistoryAdapter()
    private val attendedAdapter = RegistrationHistoryAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupRecyclerViews()
        loadHistory()

        binding.swipeRefresh.setOnRefreshListener {
            loadHistory()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }
    }

    private fun setupRecyclerViews() {
        binding.recyclerRegistered.apply {
            layoutManager = LinearLayoutManager(this@HistoryActivity)
            adapter = registeredAdapter
        }

        binding.recyclerAttended.apply {
            layoutManager = LinearLayoutManager(this@HistoryActivity)
            adapter = attendedAdapter
        }
    }

    private fun loadHistory() {
        binding.progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {
            try {
                val registeredDeferred = async { RetrofitClient.apiService.getMyRegistrations("registered") }
                val attendedDeferred = async { RetrofitClient.apiService.getMyRegistrations("attended") }

                val registeredResponse = registeredDeferred.await()
                val attendedResponse = attendedDeferred.await()

                val registered = if (registeredResponse.isSuccessful && registeredResponse.body()?.success == true) {
                    registeredResponse.body()?.data ?: emptyList()
                } else {
                    emptyList()
                }

                val attended = if (attendedResponse.isSuccessful && attendedResponse.body()?.success == true) {
                    attendedResponse.body()?.data ?: emptyList()
                } else {
                    emptyList()
                }

                binding.tvRegisteredCount.text = registered.size.toString()
                binding.tvAttendedCount.text = attended.size.toString()

                registeredAdapter.setData(registered)
                attendedAdapter.setData(attended)

                binding.layoutRegisteredEmpty.visibility = if (registered.isEmpty()) View.VISIBLE else View.GONE
                binding.layoutAttendedEmpty.visibility = if (attended.isEmpty()) View.VISIBLE else View.GONE

            } catch (e: Exception) {
                Toast.makeText(this@HistoryActivity, "Lỗi tải lịch sử: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }
}

class RegistrationHistoryAdapter : RecyclerView.Adapter<RegistrationHistoryAdapter.ViewHolder>() {

    private var items = listOf<EventRegistration>()

    fun setData(newItems: List<EventRegistration>) {
        items = newItems
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_history_event, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvEventTitle: TextView = itemView.findViewById(R.id.tvEventTitle)
        private val tvDateTime: TextView = itemView.findViewById(R.id.tvDateTime)
        private val tvLocation: TextView = itemView.findViewById(R.id.tvLocation)
        private val tvRegisteredAt: TextView = itemView.findViewById(R.id.tvRegisteredAt)
        private val tvStatus: TextView = itemView.findViewById(R.id.tvStatus)

        fun bind(item: EventRegistration) {
            tvEventTitle.text = item.event.title
            tvDateTime.text = formatEventDate(item.event.eventDate, item.event.startTime)
            tvLocation.text = item.event.location.address
            tvRegisteredAt.text = "Đăng ký: ${formatDateTime(item.registeredAt)}"
            tvStatus.text = when (item.status) {
                "attended" -> "Đã điểm danh"
                "registered" -> "Đã đăng ký"
                "cancelled" -> "Đã hủy"
                else -> item.status
            }
        }

        private fun formatEventDate(eventDate: String, startTime: String): String {
            return try {
                val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                val output = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                val date = input.parse(eventDate)
                if (date != null) "${output.format(date)} - $startTime" else "$eventDate - $startTime"
            } catch (_: Exception) {
                "$eventDate - $startTime"
            }
        }

        private fun formatDateTime(value: String): String {
            return try {
                val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                val output = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                val date = input.parse(value)
                if (date != null) output.format(date) else value
            } catch (_: Exception) {
                value
            }
        }
    }
}
