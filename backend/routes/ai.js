const express = require('express');
const router = express.Router();
const { authenticateAny } = require('../middleware/auth');
const { handleChat, getSuggestions } = require('../controllers/aiController');

// All AI routes require authentication
router.use(authenticateAny);

// POST /api/ai/chat - Nhận tin nhắn từ frontend và trả lời
router.post('/chat', handleChat);

// GET /api/ai/suggestions 
router.get('/suggestions', getSuggestions);

module.exports = router;
