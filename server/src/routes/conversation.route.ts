import express from 'express';
import { getChatList, getMessages, sendMessage, toggleAIForConversation, sendAIMessage } from '../controllers/conversation.controller';
import { verifyJWT } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(verifyJWT);

// Get list of all conversations for current user
router.get('/chatlist', getChatList);

// Get messages for a specific conversation
router.get('/get/:conversationId', getMessages);

// Send a message in a conversation
router.post('/send/:conversationId', sendMessage);

router.put('/toggle-ai/:conversationId', toggleAIForConversation);

// In your routes file where conversation routes are defined
router.post("/send-ai/:conversationId", sendAIMessage);

export default router;