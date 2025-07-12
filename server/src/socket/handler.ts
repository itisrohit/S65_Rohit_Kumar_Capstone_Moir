import { Server } from 'socket.io';
import { SOCKET_EVENTS } from './events';
import { updateUserOnlineStatus } from './services/user.service';
import { AuthenticatedSocket } from './middleware';
import { notifyConversationParticipants, notifyUser } from './service';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { Types } from 'mongoose';


// Store typing status: { conversationId: { userId: boolean } }
const typingUsers = new Map<string, Record<string, boolean>>();

// Define the MessageData interface
interface MessageData {
  id: string;
  text: string;
  conversationId: string;
  sender: string;
  time: string;
  createdAt: string;
  read?: boolean;
  isNewConversation?: boolean;
}

export const registerSocketHandlers = (io: Server) => {
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?._id}`);
    
    // Update user status to online
    if (socket.user?._id) {
      const userId = socket.user._id.toString();
      updateUserOnlineStatus(userId, true)
        .catch(console.error);
    }
    
    // Handle typing indicators
    socket.on(SOCKET_EVENTS.USER_TYPING, async (data: { conversationId: string, isTyping: boolean }) => {
      try {
        const { conversationId, isTyping } = data;
        const userId = socket.user?._id.toString();
        if (!userId) return;
        
        // Initialize conversation in typing map if needed
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, {});
        }
        
        // Get users typing in this conversation
        const conversationTyping = typingUsers.get(conversationId)!;
        
        // Only notify others if status actually changed
        const statusChanged = conversationTyping[userId] !== isTyping;
        
        if (statusChanged) {
          conversationTyping[userId] = isTyping;
          
          // Find conversation to get participants
          const conversation = await Conversation.findById(conversationId);
          if (conversation) {
            // Notify other participants about typing status change
            notifyConversationParticipants(
              conversation.participants,
              userId,
              SOCKET_EVENTS.USER_TYPING,
              {
                conversationId,
                userId,
                isTyping
              }
            );
          }
        }
      } catch (error) {
        console.error("Error handling typing indicator:", error);
      }
    });
    
    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      if (socket.user?._id) {
        const userId = socket.user._id.toString();
        updateUserOnlineStatus(userId, false)
          .catch(console.error);
      }
    });
    
    // Handle read receipts
    socket.on(SOCKET_EVENTS.MESSAGE_READ, async (data) => {
      try {
        const { conversationId } = data;
        const userId = socket.user?._id.toString();
        if (!userId) return;
        
        // Find conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: { $in: [userId] }
        });
        
        if (!conversation) return;
        
        // Find other participant
        const otherParticipantId = conversation.participants.find(
          p => p.toString() !== userId
        );
        
        // Add null check before using
        if (!otherParticipantId) {
          console.error(`Could not find other participant in conversation ${conversationId}`);
          return;
        }
        
        // Get unread messages from this conversation sent by the other participant
        const messages = await Message.find({
          conversationId,
          sender: otherParticipantId, // Now safe to use
          read: false
        });
        
        // Update message read status in database
        if (messages.length > 0) {
          await Message.updateMany(
            { 
              conversationId, 
              sender: otherParticipantId,
              read: false
            },
            { read: true }
          );
          
          // Get message IDs to send back in acknowledgment
          const messageIds = messages.map(msg => (msg._id as unknown as Types.ObjectId).toString());
          
          // Send read receipt back to sender
          notifyUser(otherParticipantId.toString(), SOCKET_EVENTS.MESSAGE_READ_ACK, {
            conversationId,
            messageIds,
            readBy: userId
          });
        }
        
        // Continue with existing code to mark the conversation as read...
        const req: any = { 
          user: { _id: userId },
          params: { conversationId }  // Add this line
        };
        const res: any = { 
          status: () => ({ json: () => {} }) 
        };
        
        // Use the markMessagesAsRead function from the controller
        const markMessagesAsReadFn = require('../controllers/conversation.controller').markMessagesAsRead;
        await markMessagesAsReadFn(req, res, () => {});
        
        console.log(`Marked messages as read in conversation ${conversationId} for user ${userId}`);
      } catch (error) {
        console.error("Error processing read receipts:", error);
      }
    });
    
    // Add new message handler
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, (messageData: MessageData) => {
      try {
        const userId = socket.user?._id.toString();
        if (!userId) return;
        
        console.log('Received message via socket:', messageData);
        
        // Transform the message to match the Message type expected by the client
        const transformedMessage = {
          id: messageData.id,
          text: messageData.text,
          sender: messageData.sender === "ai" ? "ai" : 
                 messageData.sender === userId ? "me" : "other",
          time: messageData.time,
          createdAt: messageData.createdAt,
          read: messageData.read,
        };
        
        // Handle new conversation if needed
        if (messageData.isNewConversation) {
          // You would need to handle this case specifically
          // This might involve adding the conversation to the user's list
          console.log('New conversation detected:', messageData.conversationId);
          
          // In a real implementation, you might want to fetch conversation details
          // and update the client's state
        }
        
        console.log('Transformed message:', transformedMessage);
        
        // Note: On the server side, you don't actually update the client's state directly
        // The client will receive this message and update its own state
        // This is just for logging purposes
      } catch (error) {
        console.error("Error handling incoming message:", error);
      }
    });
    
    // You may also want to handle the AI_TOGGLE event
    socket.on(SOCKET_EVENTS.AI_TOGGLE, (data: { conversationId: string, aiEnabled: boolean, toggledBy: string }) => {
      try {
        const userId = socket.user?._id.toString();
        if (!userId) return;
        
        console.log(`AI ${data.aiEnabled ? 'enabled' : 'disabled'} for conversation ${data.conversationId}`);
        
        // The client will handle updating its own state when receiving this event
      } catch (error) {
        console.error("Error handling AI toggle event:", error);
      }
    });
  });
};