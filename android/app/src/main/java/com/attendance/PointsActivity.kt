package com.attendance

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.attendance.api.LeaderboardEntry
import com.attendance.api.PointsHistory
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityPointsBinding
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale
import kotlin.math.roundToInt

class PointsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPointsBinding
    private val pointsAdapter = PointsHistoryAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPointsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupRecyclerView()
        loadMyPoints()

        binding.btnViewLeaderboard.setOnClickListener { showLeaderboard() }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { onBackPressed() }
    }

    private fun setupRecyclerView() {
        binding.recyclerPointsHistory.apply {
            layoutManager = LinearLayoutManager(this@PointsActivity)
            adapter = pointsAdapter
        }
    }

    private fun loadMyPoints() {
        binding.progressBar.visibility = View.VISIBLE
        binding.layoutEmpty.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getMyPoints()

                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    if (data != null) {
                        // Update UI
                        binding.tvTotalPoints.text = data.totalPoints.roundToInt().toString()
                        binding.tvRank.text = data.rank?.toString() ?: "--"
                        
                        val percentile = data.percentile?.let { String.format("%.1f", it) } ?: "--"
                        binding.tvPercentile.text = percentile

                        // Update history
                        if (data.pointsHistory.isNotEmpty()) {
                            pointsAdapter.setData(data.pointsHistory)
                        } else {
                            binding.layoutEmpty.visibility = View.VISIBLE
                        }
                    }
                } else {
                    val msg = response.body()?.message ?: "Không thể tải điểm"
                    Toast.makeText(this@PointsActivity, msg, Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@PointsActivity, "Lỗi: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun showLeaderboard() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_leaderboard, null)
        val recyclerView = dialogView.findViewById<RecyclerView>(R.id.recyclerLeaderboard)
        val progressBar = dialogView.findViewById<View>(R.id.progressBar)

        val dialog = AlertDialog.Builder(this)
            .setTitle("🏆 Bảng xếp hạng")
            .setView(dialogView)
            .setNegativeButton("Đóng", null)
            .create()

        recyclerView.layoutManager = LinearLayoutManager(this)
        val leaderboardAdapter = LeaderboardAdapter()
        recyclerView.adapter = leaderboardAdapter

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getLeaderboard()

                if (response.isSuccessful && response.body()?.success == true) {
                    val leaderboard = response.body()?.data?.leaderboard ?: emptyList()
                    leaderboardAdapter.setData(leaderboard)
                } else {
                    Toast.makeText(this@PointsActivity, "Không thể tải bảng xếp hạng", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@PointsActivity, "Lỗi: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }

        dialog.show()
    }
}

// Points History Adapter
class PointsHistoryAdapter : RecyclerView.Adapter<PointsHistoryAdapter.ViewHolder>() {

    private var items = listOf<PointsHistory>()

    fun setData(newItems: List<PointsHistory>) {
        items = newItems
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_points_history, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount() = items.size

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvEventTitle: TextView = itemView.findViewById(R.id.tvEventTitle)
        private val tvDate: TextView = itemView.findViewById(R.id.tvDate)
        private val tvReason: TextView = itemView.findViewById(R.id.tvReason)
        private val tvPoints: TextView = itemView.findViewById(R.id.tvPoints)

        fun bind(item: PointsHistory) {
            tvEventTitle.text = item.event.title
            val awardedAt = item.awardedAt
            
            // Format date
            try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                val outputFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                val date = awardedAt?.let { inputFormat.parse(it) }
                tvDate.text = if (date != null) outputFormat.format(date) else (awardedAt ?: "-")
            } catch (e: Exception) {
                tvDate.text = awardedAt ?: "-"
            }

            tvReason.text = "Base: ${item.basePoints} | Bonus: +${item.bonusPoints}"
            tvPoints.text = "+${item.totalPoints}"
        }
    }
}

// Leaderboard Adapter
class LeaderboardAdapter : RecyclerView.Adapter<LeaderboardAdapter.ViewHolder>() {

    private var items = listOf<LeaderboardEntry>()

    fun setData(newItems: List<LeaderboardEntry>) {
        items = newItems
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_leaderboard, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount() = items.size

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvRank: TextView = itemView.findViewById(R.id.tvRank)
        private val tvName: TextView = itemView.findViewById(R.id.tvName)
        private val tvStudentCode: TextView = itemView.findViewById(R.id.tvStudentCode)
        private val tvPoints: TextView = itemView.findViewById(R.id.tvPoints)

        fun bind(item: LeaderboardEntry) {
            tvRank.text = when (item.rank) {
                1 -> "🥇"
                2 -> "🥈"
                3 -> "🥉"
                else -> "#${item.rank}"
            }
            tvName.text = item.student.fullName
            tvStudentCode.text = item.student.studentCode
            tvPoints.text = "${item.totalPoints.roundToInt()} điểm"
        }
    }
}
