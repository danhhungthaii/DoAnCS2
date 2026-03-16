package com.attendance.fragments

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.attendance.EventDetailActivity
import com.attendance.HistoryActivity
import com.attendance.HomeActivity
import com.attendance.ScanQRActivity
import com.attendance.adapters.BannerAdapter
import com.attendance.adapters.EventAdapter
import com.attendance.adapters.OngoingEventAdapter
import com.attendance.api.RetrofitClient
import com.attendance.databinding.FragmentHomeBinding
import com.attendance.utils.PreferenceManager
import com.google.android.material.tabs.TabLayoutMediator
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var bannerAdapter: BannerAdapter
    private lateinit var eventAdapter: EventAdapter
    private lateinit var ongoingAdapter: OngoingEventAdapter
    private lateinit var prefManager: PreferenceManager

    // Receiver for real-time event updates via Socket.IO
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

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        prefManager = PreferenceManager.getInstance(requireContext())
        
        setupHeader()
        setupQuickActions()
        setupStatClicks()
        setupBanner()
        setupOngoingEvents()
        setupEventList()
        loadEvents()
        
        binding.swipeRefresh.setOnRefreshListener {
            loadEvents()
        }

        // FAB - Quick Scan QR
        binding.fabScanQR.setOnClickListener {
            openScanQRActivity()
        }
    }

    private fun setupHeader() {
        val student = prefManager.getStudent()
        if (student != null) {
            binding.tvStudentName.text = student.fullName
            val firstLetter = student.fullName.firstOrNull()?.toString()?.uppercase() ?: "A"
            binding.tvAvatarLetterHome.text = firstLetter
        }
    }

    private fun setupQuickActions() {
        // Scan QR
        binding.actionScanQR.setOnClickListener {
            openScanQRActivity()
        }

        // Events -> chuyển sang tab Sự kiện
        binding.actionEvents.setOnClickListener {
            (activity as? HomeActivity)?.navigateToEventsTab()
        }

        // History - switch to Profile tab
        binding.actionHistory.setOnClickListener {
            startActivity(Intent(requireContext(), HistoryActivity::class.java))
        }

        // Points - open PointsActivity
        binding.actionPoints.setOnClickListener {
            startActivity(Intent(requireContext(), com.attendance.PointsActivity::class.java))
        }
    }

    /**
     * Setup click handlers cho stat cards (Tổng sự kiện + Đang diễn ra)
     */
    private fun setupStatClicks() {
        // Bấm vào "Tổng sự kiện" -> chuyển sang tab Sự kiện
        binding.statTotalEvents.setOnClickListener {
            (activity as? HomeActivity)?.navigateToEventsTab()
        }

        // Bấm vào "Đang diễn ra" -> chuyển sang tab Sự kiện, filter ongoing
        binding.statOngoingEvents.setOnClickListener {
            (activity as? HomeActivity)?.navigateToEventsTab("ongoing")
        }
    }

    private fun setupBanner() {
        bannerAdapter = BannerAdapter(emptyList()) { event ->
            val intent = Intent(requireContext(), EventDetailActivity::class.java)
            intent.putExtra("eventId", event._id)
            startActivity(intent)
        }
        
        binding.viewPagerBanner.adapter = bannerAdapter
        binding.viewPagerBanner.offscreenPageLimit = 3
        
        TabLayoutMediator(binding.tabLayoutDots, binding.viewPagerBanner) { _, _ -> }.attach()
        
        setupAutoScrollBanner()
    }

    private fun setupAutoScrollBanner() {
        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        val runnable = object : Runnable {
            override fun run() {
                if (_binding != null) {
                    val currentItem = binding.viewPagerBanner.currentItem
                    val itemCount = bannerAdapter.itemCount
                    if (itemCount > 0) {
                        val nextItem = (currentItem + 1) % itemCount
                        binding.viewPagerBanner.setCurrentItem(nextItem, true)
                    }
                    handler.postDelayed(this, 3500)
                }
            }
        }
        handler.postDelayed(runnable, 3500)
    }

    /**
     * Setup horizontal RecyclerView cho sự kiện đang diễn ra
     */
    private fun setupOngoingEvents() {
        ongoingAdapter = OngoingEventAdapter(
            onEventClick = { event ->
                val intent = Intent(requireContext(), EventDetailActivity::class.java)
                intent.putExtra("eventId", event._id)
                startActivity(intent)
            },
            onCheckInClick = { event ->
                Log.d("HomeFragment", "📍 Check-in clicked for event: ${event.title}")
                Log.d("HomeFragment", "📝 Event ID: ${event._id}")
                Log.d("HomeFragment", "📍 Location: ${event.location.coordinates.latitude}, ${event.location.coordinates.longitude}")
                Log.d("HomeFragment", "📏 Radius: ${event.checkInRadius}")

                openScanQRActivity()
            }
        )

        binding.recyclerViewOngoing.apply {
            layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
            adapter = ongoingAdapter
        }

        // "Xem tất cả" -> chuyển sang tab Sự kiện filter ongoing
        binding.tvViewAllOngoing.setOnClickListener {
            (activity as? HomeActivity)?.navigateToEventsTab("ongoing")
        }
    }

    private fun setupEventList() {
        eventAdapter = EventAdapter { event ->
            val intent = Intent(requireContext(), EventDetailActivity::class.java)
            intent.putExtra("eventId", event._id)
            startActivity(intent)
        }
        
        binding.recyclerViewEvents.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = eventAdapter
        }
    }

    private fun loadEvents() {
        if (_binding == null) return
        binding.progressBar.visibility = View.VISIBLE
        
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getEvents()
                
                if (_binding == null) return@launch
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val events = response.body()?.data ?: emptyList()
                    
                    // Stats
                    binding.tvTotalEvents.text = events.size.toString()
                    val ongoingEvents = events.filter { it.status == "ongoing" }
                    binding.tvOngoingEvents.text = ongoingEvents.size.toString()
                    binding.tvEventCount.text = "${events.size} sự kiện"
                    
                    // Banner: ongoing + upcoming
                    val bannerEvents = events.filter {
                        it.status == "ongoing" || it.status == "upcoming"
                    }.take(5)
                    bannerAdapter.updateEvents(bannerEvents)

                    // Ongoing events horizontal section
                    if (ongoingEvents.isNotEmpty()) {
                        binding.sectionOngoing.visibility = View.VISIBLE
                        binding.layoutNoOngoing.visibility = View.GONE
                        ongoingAdapter.submitList(ongoingEvents)
                    } else {
                        binding.sectionOngoing.visibility = View.GONE
                        binding.layoutNoOngoing.visibility = View.VISIBLE
                    }

                    // All events list
                    eventAdapter.submitList(events)
                    
                    val isEmpty = events.isEmpty()
                    binding.layoutEmptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
                    binding.recyclerViewEvents.visibility = if (isEmpty) View.GONE else View.VISIBLE
                } else {
                    Toast.makeText(requireContext(), "Không thể tải sự kiện", Toast.LENGTH_SHORT).show()
                }
            } catch (e: CancellationException) {
                // Fragment destroyed - ignore
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
    
    /**
     * Mở màn hình quét QR ở chế độ tự nhận sự kiện theo mã QR
     */
    private fun openScanQRActivity() {
        val intent = Intent(requireContext(), ScanQRActivity::class.java)
        startActivity(intent)
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
