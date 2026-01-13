package com.attendance

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.constraintlayout.widget.ConstraintSet

/**
 * CheckInResultActivity - Màn hình hiển thị kết quả check-in
 */
class CheckInResultActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val success = intent.getBooleanExtra("SUCCESS", false)
        val message = intent.getStringExtra("MESSAGE") ?: ""
        val eventTitle = intent.getStringExtra("EVENT_TITLE") ?: ""

        // Create layout programmatically
        val layout = ConstraintLayout(this).apply {
            layoutParams = ConstraintLayout.LayoutParams(
                ConstraintLayout.LayoutParams.MATCH_PARENT,
                ConstraintLayout.LayoutParams.MATCH_PARENT
            )
            setPadding(64, 64, 64, 64)
        }

        val ivResult = ImageView(this).apply {
            id = View.generateViewId()
            setImageResource(
                if (success) android.R.drawable.ic_menu_info_details
                else android.R.drawable.ic_delete
            )
            layoutParams = ConstraintLayout.LayoutParams(300, 300)
        }

        val tvResultTitle = TextView(this).apply {
            id = View.generateViewId()
            text = if (success) "Check-in thành công!" else "Check-in thất bại"
            textSize = 24f
            setTextColor(getColor(R.color.primary))
            layoutParams = ConstraintLayout.LayoutParams(
                ConstraintLayout.LayoutParams.WRAP_CONTENT,
                ConstraintLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val tvResultMessage = TextView(this).apply {
            id = View.generateViewId()
            text = if (success) "Bạn đã check-in thành công vào sự kiện:\n$eventTitle\n\n$message" else message
            textSize = 16f
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            layoutParams = ConstraintLayout.LayoutParams(
                ConstraintLayout.LayoutParams.MATCH_PARENT,
                ConstraintLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val btnBack = Button(this).apply {
            id = View.generateViewId()
            text = "Quay về danh sách"
            setOnClickListener { navigateToEventList() }
            layoutParams = ConstraintLayout.LayoutParams(
                ConstraintLayout.LayoutParams.MATCH_PARENT,
                ConstraintLayout.LayoutParams.WRAP_CONTENT
            )
        }

        layout.addView(ivResult)
        layout.addView(tvResultTitle)
        layout.addView(tvResultMessage)
        layout.addView(btnBack)

        val constraintSet = ConstraintSet()
        constraintSet.clone(layout)

        // Image constraints
        constraintSet.connect(ivResult.id, ConstraintSet.TOP, ConstraintSet.PARENT_ID, ConstraintSet.TOP, 64)
        constraintSet.connect(ivResult.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START)
        constraintSet.connect(ivResult.id, ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END)

        // Title constraints
        constraintSet.connect(tvResultTitle.id, ConstraintSet.TOP, ivResult.id, ConstraintSet.BOTTOM, 32)
        constraintSet.connect(tvResultTitle.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START)
        constraintSet.connect(tvResultTitle.id, ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END)

        // Message constraints
        constraintSet.connect(tvResultMessage.id, ConstraintSet.TOP, tvResultTitle.id, ConstraintSet.BOTTOM, 24)
        constraintSet.connect(tvResultMessage.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START)
        constraintSet.connect(tvResultMessage.id, ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END)

        // Button constraints
        constraintSet.connect(btnBack.id, ConstraintSet.BOTTOM, ConstraintSet.PARENT_ID, ConstraintSet.BOTTOM, 32)
        constraintSet.connect(btnBack.id, ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START)
        constraintSet.connect(btnBack.id, ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END)

        constraintSet.applyTo(layout)
        setContentView(layout)
    }

    private fun navigateToEventList() {
        val intent = Intent(this, EventListActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        startActivity(intent)
        finish()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        super.onBackPressed()
        navigateToEventList()
    }
}

