import express from 'express';
import { authenticate } from '../middleware/auth.js';
import chatController from '../controllers/chatController.js';

const router = express.Router();

// @route   POST /api/chat
// @desc    Process customer support chat
router.post('/chat', authenticate, (req: any, res) => chatController.chat(req, res));

// @route   GET /api/chat/history
// @desc    Get chat history for a customer
router.get('/chat/history', authenticate, (req: any, res) => 
  chatController.getChatHistory(req, res)
);

export default router;
