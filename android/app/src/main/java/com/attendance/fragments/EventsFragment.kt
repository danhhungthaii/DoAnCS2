package com.attendance.fragments

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.attendance.EventDetailActivity
import com.attendance.adapters.EventAdapter
import com.attendance.api.RetrofitClient
import com.attendance.databinding.FragmentEventsBinding
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

/**
 * EventsFragment - Tab "Sự kiện" trong bottom navigation
 * Hiển thị danh sách sự kiện theo trạng thái (đang diễn ra / sắp diễn ra / đã kết thúc)
 */
class EventsFragment : Fragment() {

    private var _binding: FragmentEventsBinding? = null
    private val binding get() = _binding!!

    private lateinit var eventAdapter: EventAdapter

    // Filter status passed from HomeFragment
    private var initialFilterStatus: String? = null

    // Auto-refresh when admin creates new event from web
    private val eventNewReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (_binding != null && isAdded) {
                loadEvents()
                com.google.android.material.snackbar.Snackbar
                    .make(binding.root, "Có sự kiện mới!", com.google.android.material.snackbar.Snackbar.LENGTH_SHORT)
                    .show()
            }
        }
    }

    companion object {
        private const val ARG_FILTER_STATUS = "filter_status"

        fun newInstance(filterStatus: String? = null): EventsFragment {
            return EventsFragment().apply {
                arguments = Bundle().apply {
                    filterStatus?.let { putString(ARG_FILTER_STATUS, it) }
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initialFilterStatus = arguments?.getString(ARG_FILTER_STATUS)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEventsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupTabs()
        setupRecyclerView()

        // Select initial tab based on filter
        val tabIndex = when (initialFilterStatus) {
            "ongoing" -> 0
            "upcoming" -> 1
            "completed" -> 2
            else -> 0
        }
        binding.tabLayout.getTabAt(tabIndex)?.select()

        loadEvents()

        binding.swipeRefresh.setOnRefreshListener {
            loadEvents()
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

    private fun setupRecyclerView() {
        eventAdapter = EventAdapter { event ->
            val intent = Intent(requireContext(), EventDetailActivity::class.java).apply {
                putExtra("eventId", event._id)
            }
            startActivity(intent)
        }

        binding.rvEvents.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = eventAdapter
        }
    }

    private fun loadEvents() {
        if (_binding == null) return

        binding.progressBar.visibility = View.VISIBLE

        // Determine target status based on selected tab
        val targetStatus = when (binding.tabLayout.selectedTabPosition) {
            0 -> "ongoing"
            1 -> "upcoming"
            2 -> "completed"
            else -> "ongoing"
        }

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                // Get all events without status filter (backend filter may be outdated)
                val response = RetrofitClient.apiService.getEvents()

                if (_binding == null) return@launch

                if (response.isSuccessful && response.body()?.success == true) {
                    val allEvents = response.body()?.data ?: emptyList()
                    
                    // CLIENT-SIDE FILTER: Use getComputedStatus() for real-time filtering
                    val filteredEvents = allEvents.filter { event ->
                        event.getComputedStatus() == targetStatus
                    }

                    if (filteredEvents.isEmpty()) {
                        binding.layoutEmpty.visibility = View.VISIBLE
                        binding.rvEvents.visibility = View.GONE
                    } else {
                        binding.layoutEmpty.visibility = View.GONE
                        binding.rvEvents.visibility = View.VISIBLE
                        eventAdapter.submitList(filteredEvents)
                    }
                } else {
                    Toast.makeText(requireContext(), "Không thể tải sự kiện", Toast.LENGTH_SHORT).show()
                }
            } catch (e: CancellationException) {
                // Fragment destroyed
            } catch (e: Exception) {
                if (_binding != null && isAdded) {
                    Toast.makeText(requireContext(), "Lỗi kết nối: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            } finally {
                if (_binding != null) {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        LocalBroadcastManager.getInstance(requireContext())
            .registerReceiver(eventNewReceiver, IntentFilter("com.attendance.EVENT_NEW"))
    }

    override fun onPause() {
        super.onPause()
        LocalBroadcastManager.getInstance(requireContext())
            .unregisterReceiver(eventNewReceiver)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
