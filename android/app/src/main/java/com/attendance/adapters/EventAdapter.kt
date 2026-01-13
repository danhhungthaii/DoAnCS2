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

/**
 * EventAdapter - RecyclerView Adapter cho danh sách sự kiện
 */
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
                tvEventDate.text = formatDateTime(event.dateTime)
                tvEventStatus.text = when (event.status) {
                    "upcoming" -> "Sắp diễn ra"
                    "ongoing" -> "Đang diễn ra"
                    "completed" -> "Đã kết thúc"
                    else -> event.status
                }
                
                root.setOnClickListener {
                    onEventClick(event)
                }
            }
        }
        
        private fun formatDateTime(dateString: String): String {
            return try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                val outputFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                val date = inputFormat.parse(dateString)
                outputFormat.format(date ?: Date())
            } catch (e: Exception) {
                dateString
            }
        }
    }
    
    class EventDiffCallback : DiffUtil.ItemCallback<Event>() {
        override fun areItemsTheSame(oldItem: Event, newItem: Event): Boolean {
            return oldItem.id == newItem.id
        }
        
        override fun areContentsTheSame(oldItem: Event, newItem: Event): Boolean {
            return oldItem == newItem
        }
    }
}
