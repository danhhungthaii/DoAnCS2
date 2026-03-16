package com.attendance.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.attendance.api.Event
import com.attendance.databinding.ItemEventOngoingBinding
import java.text.SimpleDateFormat
import java.util.*

/**
 * OngoingEventAdapter - Adapter cho danh sách sự kiện đang diễn ra (horizontal)
 */
class OngoingEventAdapter(
    private val onEventClick: (Event) -> Unit,
    private val onCheckInClick: (Event) -> Unit
) : RecyclerView.Adapter<OngoingEventAdapter.ViewHolder>() {

    private var events: List<Event> = emptyList()

    fun submitList(newEvents: List<Event>) {
        events = newEvents
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemEventOngoingBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(events[position])
    }

    override fun getItemCount(): Int = events.size

    inner class ViewHolder(
        private val binding: ItemEventOngoingBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(event: Event) {
            binding.tvOngoingTitle.text = event.title
            binding.tvOngoingDate.text = formatDateTime(event.dateTime, event.endDateTime)
            binding.tvOngoingLocation.text = event.location.address

            binding.root.setOnClickListener { onEventClick(event) }
            binding.btnCheckIn.setOnClickListener { onCheckInClick(event) }
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
}
