package com.attendance

import android.content.Intent
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityHomeBinding
import com.attendance.fragments.EventsFragment
import com.attendance.fragments.HomeFragment
import com.attendance.fragments.ProfileFragment
import com.attendance.fragments.SettingsFragment
import com.attendance.utils.PreferenceManager
import com.attendance.utils.SocketManager
import com.attendance.utils.UIFeedback
import com.google.android.material.navigation.NavigationBarView
import org.json.JSONObject

/**
 * HomeActivity - Main screen with Bottom Navigation
 * Contains: Home, Events, Profile, Settings tabs
 * Plus: Draggable AI Chat FAB button
 */
class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private lateinit var prefManager: PreferenceManager

    // For Draggable Chat FAB
    private var dX = 0f
    private var dY = 0f
    private var isDragging = false
    private val CLICK_DRAG_TOLERANCE = 10f

    companion object {
        private const val TAG = "HomeActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize PreferenceManager and load saved token
        prefManager = PreferenceManager.getInstance(this)
        val savedToken = prefManager.getAuthToken()
        if (savedToken != null) {
            RetrofitClient.setAuthToken(savedToken)
        }

        setupBottomNavigation()
        setupSocketIO()
        setupChatFAB()

        // Load Home Fragment by default
        if (savedInstanceState == null) {
            loadFragment(HomeFragment())
        }
    }

    private fun setupSocketIO() {
        val studentId = prefManager.getStudent()?.id
        if (studentId != null) {
            SocketManager.connect(studentId)

            // Listen for verification results (points awarded)
            SocketManager.setOnVerificationResultListener { data ->
                runOnUiThread {
                    val message = data.optString("message", "Bạn đã nhận được điểm!")
                    val points = data.optDouble("totalPoints", 0.0)
                    
                    Toast.makeText(
                        this,
                        "🎉 $message\nTổng điểm: $points",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener(NavigationBarView.OnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> {
                    loadFragment(HomeFragment())
                    return@OnItemSelectedListener true
                }
                R.id.navigation_events -> {
                    loadFragment(EventsFragment())
                    return@OnItemSelectedListener true
                }
                R.id.navigation_profile -> {
                    loadFragment(ProfileFragment())
                    return@OnItemSelectedListener true
                }
                R.id.navigation_settings -> {
                    loadFragment(SettingsFragment())
                    return@OnItemSelectedListener true
                }
                else -> return@OnItemSelectedListener false
            }
        })
    }
    
    
    /**
     * Setup Floating AI Chatbox (Draggable)
     */
    private fun setupChatFAB() {
        val fabChat = binding.fabAiChat
        
        fabChat.setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    dX = view.x - event.rawX
                    dY = view.y - event.rawY
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val newX = event.rawX + dX
                    val newY = event.rawY + dY
                    
                    if (Math.abs(newX - view.x) > CLICK_DRAG_TOLERANCE || Math.abs(newY - view.y) > CLICK_DRAG_TOLERANCE) {
                        isDragging = true
                    }
                    
                    val parent = view.parent as View
                    val maxX = parent.width - view.width
                    val maxY = parent.height - view.height

                    view.animate()
                        .x(newX.coerceIn(0f, maxX.toFloat()))
                        .y(newY.coerceIn(0f, maxY.toFloat()))
                        .setDuration(0)
                        .start()
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        view.performClick()
                        openChatWindow()
                    }
                    true
                }
                else -> false
            }
        }
    }
    
    private fun openChatWindow() {
        val intent = Intent(this, ChatActivity::class.java)
        startActivity(intent)
    }
    
    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }

    /**
     * Navigate to Events tab with optional filter status
     */
    fun navigateToEventsTab(filterStatus: String? = null) {
        val fragment = EventsFragment.newInstance(filterStatus)
        loadFragment(fragment)
        binding.bottomNavigation.selectedItemId = R.id.navigation_events
    }

    override fun onBackPressed() {
        if (binding.bottomNavigation.selectedItemId != R.id.navigation_home) {
            binding.bottomNavigation.selectedItemId = R.id.navigation_home
        } else {
            moveTaskToBack(true)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        SocketManager.disconnect()
        SocketManager.clearListeners()
    }
}
