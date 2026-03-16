const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

/**
 * Gọi trực tiếp Groq OpenAI-compatible API
 */
const callGroqChatCompletion = async (messages) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  if (process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY_PLACEHOLDER');
  }

  const endpoint = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
      messages,
      max_tokens: parseInt(process.env.AI_MAX_TOKENS, 10) || 1024,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error('GROQ_API_ERROR');
    error.status = response.status;
    error.details = errorBody;
    throw error;
  }

  return response.json();
};

/**
 * Lấy thống kê hệ thống từ MongoDB để cung cấp ngữ cảnh cho AI
 */
const fetchSystemStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEvents, totalStudents, upcomingEvents, todayAttendance] = await Promise.all([
      Event.countDocuments(),
      Student.countDocuments(),
      Event.countDocuments({ eventDate: { $gte: new Date() } }),
      Attendance.countDocuments({ createdAt: { $gte: today } }),
    ]);

    return { totalEvents, totalStudents, upcomingEvents, todayAttendance };
  } catch {
    return null;
  }
};

/**
 * Tạo system prompt cho AI assistant
 */
const buildSystemPrompt = (stats) => {
  const dateStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const statsSection = stats
    ? `Thống kê hệ thống hiện tại:
- Tổng số sự kiện: ${stats.totalEvents}
- Sự kiện sắp diễn ra: ${stats.upcomingEvents}
- Tổng số sinh viên: ${stats.totalStudents}
- Lượt điểm danh hôm nay: ${stats.todayAttendance}`
    : 'Thống kê hệ thống: Không khả dụng';

  return `Bạn là trợ lý AI của hệ thống Quản lý Điểm Danh QR Code dành cho trường đại học.

Hôm nay: ${dateStr}
${statsSection}

Tính năng chính của hệ thống:
- Tạo và quản lý sự kiện (hội thảo, hội nghị, lớp học)
- Sinh viên điểm danh bằng QR Code qua ứng dụng di động
- Admin duyệt điểm danh và quản lý bằng chứng ảnh
- Xuất báo cáo và thống kê điểm danh chi tiết
- Tích điểm rèn luyện cho sinh viên tham gia sự kiện

Hướng dẫn phản hồi:
- Luôn trả lời bằng tiếng Việt, ngắn gọn và thân thiện
- Khi hướng dẫn, dùng danh sách bước cụ thể
- Nếu không biết thông tin cụ thể, hãy thành thật thay vì bịa đặt
- Không trả lời các câu hỏi không liên quan đến hệ thống điểm danh
- Tối đa 300 từ mỗi câu trả lời`;
};

/**
 * @desc    Xử lý tin nhắn chat với AI
 * @route   POST /api/ai/chat
 * @access  Private
 */
exports.handleChat = async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu tin nhắn không hợp lệ',
      });
    }

    // Sanitize và giới hạn lịch sử hội thoại (tối đa 20 tin nhắn cuối)
    const sanitizedMessages = messages
      .slice(-20)
      .filter(m => m && typeof m.content === 'string' && m.content.trim())
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content.trim().slice(0, 2000), // Giới hạn độ dài mỗi tin
      }));

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống',
      });
    }

    // Lấy thống kê hệ thống làm ngữ cảnh
    const stats = await fetchSystemStats();

    const completion = await callGroqChatCompletion([
      { role: 'system', content: buildSystemPrompt(stats) },
      ...sanitizedMessages,
    ]);

    const reply = completion.choices?.[0]?.message?.content
      || 'Xin lỗi, tôi không thể phản hồi lúc này. Vui lòng thử lại.';

    res.json({
      success: true,
      data: {
        role: 'assistant',
        content: reply,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);

    if (error.message === 'GROQ_API_KEY_MISSING') {
      return res.status(503).json({
        success: false,
        message: 'Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để thiết lập API key.',
      });
    }

    if (error.message === 'GROQ_API_KEY_PLACEHOLDER') {
      return res.status(503).json({
        success: false,
        message: 'Bạn chưa thay GROQ_API_KEY trong file .env. Vui lòng dán API key thật từ Groq Console.',
      });
    }

    if (error.status === 401) {
      return res.status(503).json({
        success: false,
        message: 'API key Groq không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra GROQ_API_KEY.',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Hệ thống AI đang quá tải. Vui lòng thử lại sau vài giây.',
      });
    }

    if (error.status === 404) {
      return res.status(503).json({
        success: false,
        message: 'Model AI không tồn tại hoặc chưa được hỗ trợ. Vui lòng kiểm tra AI_MODEL.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi kết nối AI. Vui lòng thử lại sau.',
    });
  }
};

/**
 * @desc    Lấy danh sách câu hỏi gợi ý cho chatbox
 * @route   GET /api/ai/suggestions
 * @access  Private
 */
exports.getSuggestions = async (req, res) => {
  const suggestions = [
    'Có bao nhiêu sự kiện đang diễn ra?',
    'Làm thế nào để tạo sự kiện mới?',
    'Cách xuất báo cáo điểm danh?',
    'Hôm nay có bao nhiêu lượt điểm danh?',
    'Sinh viên điểm danh bằng QR như thế nào?',
  ];

  res.json({ success: true, data: suggestions });
};
