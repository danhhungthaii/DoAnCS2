package com.attendance.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.attendance.BuildConfig
import com.attendance.api.Event
import com.attendance.databinding.ItemBannerBinding
import com.bumptech.glide.Glide
import java.text.SimpleDateFormat
import java.util.*

/**
 * BannerAdapter - For ViewPager2 banner carousel
 */
class BannerAdapter(
    private var events: List<Event>,
    private val onEventClick: (Event) -> Unit
) : RecyclerView.Adapter<BannerAdapter.BannerViewHolder>() {

    inner class BannerViewHolder(private val binding: ItemBannerBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(event: Event) {
            binding.apply {
                tvBannerTitle.text = event.title
                tvBannerDate.text = formatDateTime(event.dateTime, event.endDateTime)

                // Use computed status for real-time updates
                tvBannerStatus.text = event.getStatusText()

                // Load banner image
                if (!event.bannerUrl.isNullOrEmpty()) {
                    // Check if URL is already absolute (external URLs like Picsum/Unsplash)
                    val imageUrl = if (event.bannerUrl.startsWith("http://") || event.bannerUrl.startsWith("https://")) {
                        event.bannerUrl
                    } else {
                        // Relative URL - prepend base URL
                        val baseUrl = BuildConfig.API_BASE_URL.replace("/api/", "")
                        baseUrl + event.bannerUrl
                    }
                    
                    Glide.with(binding.root.context)
                        .load(imageUrl)
                        .centerCrop()
                        .signature(com.bumptech.glide.signature.ObjectKey(event.bannerUrl ?: ""))
                        .into(ivBannerImage)
                } else {
                    ivBannerImage.setImageResource(android.R.color.transparent)
                }
                
                root.setOnClickListener {
                    onEventClick(event)
                }
            }
        }

        private fun formatDateTime(startDateString: String, endDateString: String?): String {
            return try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                inputFormat.timeZone = java.util.TimeZone.getTimeZone("UTC")
                
                val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                
                val startDate = inputFormat.parse(startDateString)
                if (startDate != null) {
                    val formattedDate = dateFormat.format(startDate)
                    val startTime = timeFormat.format(startDate)
                    
                    // Parse end time if available
                    val endTime = if (!endDateString.isNullOrEmpty()) {
                        try {
                            val endDate = inputFormat.parse(endDateString)
                            if (endDate != null) timeFormat.format(endDate) else ""
                        } catch (e: Exception) {
                            ""
                        }
                    } else {
                        ""
                    }
                    
                    // Format: "dd/MM/yyyy - HH:mm-HH:mm"
                    if (endTime.isNotEmpty()) {
                        "$formattedDate - $startTime-$endTime"
                    } else {
                        "$formattedDate - $startTime"
                    }
                } else {
                    startDateString
                }
            } catch (e: Exception) {
                startDateString
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BannerViewHolder {
        val binding = ItemBannerBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return BannerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: BannerViewHolder, position: Int) {
        holder.bind(events[position])
    }

    override fun getItemCount(): Int = events.size

    fun updateEvents(newEvents: List<Event>) {
        events = newEvents
        notifyDataSetChanged()
    }
}
