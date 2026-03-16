package com.attendance.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.attendance.api.Event
import com.attendance.databinding.ItemEventBinding
import java.text.SimpleDateFormat
import java.util.*

class EventAdapter(
    private val onEventClick: (Event) -> Unit
) : ListAdapter<Event, EventAdapter.EventViewHolder>(EventDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EventViewHolder {
        val binding = ItemEventBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return EventViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: EventViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class EventViewHolder(
        private val binding: ItemEventBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(event: Event) {
            binding.apply {
                tvEventTitle.text = event.title
                tvEventLocation.text = event.location.address
                tvEventDate.text = formatDateTime(event.dateTime, event.endDateTime)

                // Use computed status for real-time updates
                tvEventStatus.text = event.getStatusText()

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
    
    class EventDiffCallback : DiffUtil.ItemCallback<Event>() {
        override fun areItemsTheSame(oldItem: Event, newItem: Event): Boolean {
            return oldItem._id == newItem._id
        }
        
        override fun areContentsTheSame(oldItem: Event, newItem: Event): Boolean {
            return oldItem == newItem
        }
    }
}
