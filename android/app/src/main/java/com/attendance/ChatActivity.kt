package com.attendance

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.widget.Toast
import com.attendance.api.AiChatMessage
import com.attendance.api.AiChatRequest
import com.attendance.api.RetrofitClient
import com.attendance.databinding.ActivityChatBinding
import com.attendance.utils.PreferenceManager
import kotlinx.coroutines.launch

data class ChatMessage(
    val message: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

class ChatAdapter(private val messages: List<ChatMessage>) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val VIEW_TYPE_USER = 1
    private val VIEW_TYPE_AI = 2

    override fun getItemViewType(position: Int): Int {
        return if (messages[position].isUser) VIEW_TYPE_USER else VIEW_TYPE_AI
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == VIEW_TYPE_USER) {
            val view = inflater.inflate(R.layout.item_chat_user, parent, false)
            UserViewHolder(view)
        } else {
            val view = inflater.inflate(R.layout.item_chat_ai, parent, false)
            AiViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val message = messages[position]
        if (holder is UserViewHolder) {
            holder.tvMessage.text = message.message
        } else if (holder is AiViewHolder) {
            holder.tvMessage.text = message.message
        }
    }

    override fun getItemCount() = messages.size

    class UserViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvMessage: TextView = itemView.findViewById(R.id.tvMessage)
    }

    class AiViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvMessage: TextView = itemView.findViewById(R.id.tvMessage)
    }
}

class ChatActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "ChatActivity"
    }

    private lateinit var binding: ActivityChatBinding
    private lateinit var prefManager: PreferenceManager
    private val messages = mutableListOf<ChatMessage>()
    private lateinit var adapter: ChatAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefManager = PreferenceManager.getInstance(this)
        RetrofitClient.setAuthToken(prefManager.getAuthToken())

        setupToolbar()
        setupRecyclerView()
        setupInput()

        // Thêm lời chào ban đầu
        addAiMessage("✨ Xin chào, tôi là trợ lý AI. Tôi có thể giúp gì cho bạn trong hệ thống quản lý điểm danh này?")
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setDisplayShowHomeEnabled(true)
        binding.toolbar.setNavigationOnClickListener {
            onBackPressed()
        }
    }

    private fun setupRecyclerView() {
        adapter = ChatAdapter(messages)
        binding.rvMessages.adapter = adapter
        val layoutManager = LinearLayoutManager(this)
        layoutManager.stackFromEnd = true
        binding.rvMessages.layoutManager = layoutManager
    }

    private fun setupInput() {
        binding.btnSend.setOnClickListener {
            val messageText = binding.etMessage.text.toString().trim()
            if (messageText.isNotEmpty()) {
                addUserMessage(messageText)
                binding.etMessage.text.clear()
                
                // Hide keyboard
                val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(binding.etMessage.windowToken, 0)

                sendMessageToAi()
            }
        }
    }

    private fun addUserMessage(text: String) {
        messages.add(ChatMessage(text, isUser = true))
        adapter.notifyItemInserted(messages.size - 1)
        binding.rvMessages.scrollToPosition(messages.size - 1)
    }

    private fun addAiMessage(text: String) {
        messages.add(ChatMessage(text, isUser = false))
        adapter.notifyItemInserted(messages.size - 1)
        binding.rvMessages.scrollToPosition(messages.size - 1)
    }

    private fun sendMessageToAi() {
        val history = messages
            .takeLast(20)
            .map {
                AiChatMessage(
                    role = if (it.isUser) "user" else "assistant",
                    content = it.message
                )
            }

        binding.btnSend.isEnabled = false
        binding.btnSend.alpha = 0.5f

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.chatWithAi(AiChatRequest(messages = history))
                val body = response.body()

                if (response.isSuccessful && body?.success == true) {
                    val aiText = body.data?.content?.trim()
                    if (!aiText.isNullOrEmpty()) {
                        addAiMessage(aiText)
                    } else {
                        addAiMessage("AI chưa trả về nội dung hợp lệ. Bạn vui lòng thử lại nhé.")
                    }
                } else {
                    if (response.code() == 401) {
                        addAiMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục dùng Chat AI.")
                        handleSessionExpired()
                        return@launch
                    }

                    val errorText = body?.message ?: "Không thể kết nối Chat AI (${response.code()})."
                    addAiMessage(errorText)
                    Log.w(TAG, "sendMessageToAi: Failed ${response.code()} - $errorText")
                }
            } catch (e: Exception) {
                Log.e(TAG, "sendMessageToAi: Exception", e)
                addAiMessage("Không kết nối được backend AI. Bạn kiểm tra mạng hoặc API server rồi thử lại nhé.")
            } finally {
                binding.btnSend.isEnabled = true
                binding.btnSend.alpha = 1f
            }
        }
    }

    private fun handleSessionExpired() {
        prefManager.clearSession()
        RetrofitClient.setAuthToken(null)

        Toast.makeText(this, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", Toast.LENGTH_LONG).show()

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}
