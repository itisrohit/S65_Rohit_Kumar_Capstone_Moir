import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/socket/socket';
import { EVENTS } from '@/socket/socketEvents';
import { useAuthStore } from '@/store/authStore';
import { useChatStore, Message } from '@/store/chatStore'; 
import { useFriendStore } from '@/store/friendStore';

interface MessageData {
  id: string;
  text: string;
  conversationId: string;
  sender: string;
  time: string;
  createdAt: string;
  read?: boolean;
}

interface UserStatusEvent {
  userId: string;
}

interface ChatUpdateEvent {
  id: string;
  lastMessage: string;
  timestamp: string;
  updatedAt: string;
}

interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface ReadReceiptEvent {
  conversationId: string;
  messageIds: string[];
  readBy?: string;
}

// First, ensure the interfaces match exactly what the server sends
interface FriendRequestEvent {
  requestId: string;
  requester: {
    _id: string;
    name: string;
    username: string;
    image: string;
    status: string;
  };
  isRead: boolean;
}

interface FriendResponseEvent {
  friendshipId: string;
  accepted: boolean;
  user: {
    _id: string;
    name: string;
    username: string;
    image: string;
    status: string;
  };
}

// Add this interface for user update events
interface UserUpdateEvent {
  user: {
    _id: string;
    name: string;
    username: string;
    image: string;
    status: string;
  };
}

// Add this interface for AI toggle events
interface AIToggleEvent {
  conversationId: string;
  aiEnabled: boolean;
  toggledBy: string;
}

// Global flags to track socket connection and event handlers
let socketInitialized = false;
let handlersRegistered = false;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { 
    updateChatOnlineStatus, 
    addNewMessage, 
    updateLastMessageInfo, 
    setUserTyping,
    markChatAsRead 
  } = useChatStore();
  
  // Connect socket when authenticated - but only initialize once
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    
    if (!socketInitialized) {
      console.log("Initializing global socket connection");
      socketRef.current = connectSocket(accessToken);
      socketInitialized = true;
    } else {
      console.log("Socket already initialized, reusing connection");
      socketRef.current = getSocket();
    }
    
    // No cleanup needed for page navigation - socket persists
    return () => {
      // Don't disconnect socket on component unmount
      console.log("Component unmounting, keeping socket connection");
    };
  }, [isAuthenticated, accessToken]);
  
  // Register event handlers - but only once globally
  useEffect(() => {
    // Always use the global socket to ensure consistent event handling
    const socket = getSocket();
    if (!socket) {
      console.log("No socket available for event registration");
      return;
    }
    
    // Skip if handlers are already registered
    if (handlersRegistered) {
      console.log("Event handlers already registered, skipping");
      return;
    }
    
    console.log("Registering socket event handlers GLOBALLY");
    handlersRegistered = true;
    
    const messageHandler = (messageData: MessageData) => {
      // Ensure lowercase am/pm for incoming messages
      if (messageData.time) {
        messageData.time = messageData.time.replace(/AM|PM/g, match => match.toLowerCase());
      }
      
      console.log('Message received:', messageData);
      const { conversationId } = messageData;
      
      // Get current state to check for active chat
      const state = useChatStore.getState();
      const currentUserId = useAuthStore.getState().user?._id;
      
      // Check BOTH if this is the selected chat AND if we're on a chat page
      const currentPath = window.location.pathname;
      const isOnChatPage = currentPath.startsWith('/v/chat');
      const isActiveChat = isOnChatPage && state.selectedChatId === conversationId;
      
      // Transform the message to match our Message type
      const transformedMessage: Message = {
        id: messageData.id,
        text: messageData.text,
        // Add this special check for "ai" sender
        sender: messageData.sender === "ai" ? "ai" : 
               messageData.sender === currentUserId ? "me" : "other",
        time: messageData.time,
        read: messageData.read,
      };
      
      // Add read status flag to message if it's in the active chat
      const messageWithReadFlag = {
        ...transformedMessage,
        _isInActiveChat: isActiveChat 
      };
      
      // Check for duplicates
      const currentMessages = state.chatMessages[conversationId] || [];
      const messageExists = currentMessages.some(msg => msg.id === messageData.id);
      
      if (!messageExists) {
        // Add the message with the read flag
        addNewMessage(conversationId, messageWithReadFlag);
        console.log('Message added to store, active chat:', isActiveChat);
        
        // If this is the active chat, mark as read
        if (isActiveChat) {
          markChatAsRead(conversationId);
          
          setTimeout(() => {
            const currentSocket = getSocket();
            if (currentSocket) {
              console.log('Marking messages as read for active chat:', conversationId);
              currentSocket.emit(EVENTS.MESSAGE_READ, { conversationId });
            }
          }, 300);
        }
      } else {
        console.log('Duplicate message ignored:', messageData.id);
      }
    };
    
    // Create named handlers for better cleanup
    const onlineHandler = ({ userId }: UserStatusEvent) => {
      console.log('User online:', userId);
      // Update chat store
      updateChatOnlineStatus(userId, true);
      // Update friend store as well
      useFriendStore.getState().updateFriendStatus(userId, true);
    };
    
    const offlineHandler = ({ userId }: UserStatusEvent) => {
      console.log('User offline:', userId);
      // Update chat store
      updateChatOnlineStatus(userId, false);
      // Update friend store as well
      useFriendStore.getState().updateFriendStatus(userId, false);
    };
    
    const messageUpdateHandler = (data: ChatUpdateEvent) => {
      console.log('Chat update:', data);
      updateLastMessageInfo(data);
    };
    
    const typingHandler = ({ conversationId, userId, isTyping }: TypingEvent) => {
      console.log('🔵 TYPING EVENT RECEIVED:', {
        conversationId,
        userId,
        isTyping,
        currentUserId: useAuthStore.getState().user?._id,
        selectedId: useChatStore.getState().selectedChatId
      });
      setUserTyping(conversationId, userId, isTyping);
    };
    
    // Add this handler for read receipts
    const readReceiptHandler = ({ conversationId, messageIds }: ReadReceiptEvent) => {
      console.log('Messages marked as read by recipient:', messageIds);
      useChatStore.getState().updateMessageReadStatus(conversationId, messageIds);
    };
    
    // Friend-related event handlers
    const friendRequestHandler = (data: FriendRequestEvent) => {
      console.log('Friend request received:', data);
      try {
        // Validate the incoming data has the required fields
        if (!data.requestId || !data.requester || !data.requester._id) {
          console.error('Invalid friend request data received:', data);
          return;
        }

        // Transform to match the store's expected format
        const friendRequest = {
          id: data.requestId,
          user: data.requester,
          createdAt: new Date().toISOString(),
          isRead: !!data.isRead
        };
        
        // Update the friend store
        useFriendStore.getState().addFriendRequest(friendRequest);
        
        // Force a refresh of incoming requests to ensure UI updates
        setTimeout(() => {
          useFriendStore.getState().fetchFriendRequests('incoming');
        }, 500);
      } catch (error) {
        console.error('Error processing friend request:', error);
      }
    };

    const friendResponseHandler = (data: FriendResponseEvent) => {
      console.log('Friend request response received:', data);
      try {
        // Validate incoming data
        if (!data.friendshipId) {
          console.error('Invalid friend response data:', data);
          return;
        }
        
        // Update the friend request status
        useFriendStore.getState().updateFriendRequestStatus(
          data.friendshipId, 
          data.accepted
        );
        
        // If accepted, ensure friends list is refreshed
        if (data.accepted) {
          // Force fetch friends after a short delay to ensure server has updated
          setTimeout(() => {
            useFriendStore.getState().fetchFriends();
          }, 500);
        }
        
        // Always refresh outgoing requests to keep UI in sync
        setTimeout(() => {
          useFriendStore.getState().fetchFriendRequests('outgoing');
        }, 800);
      } catch (error) {
        console.error('Error processing friend response:', error);
      }
    };

    const friendRequestSeenHandler = ({ friendshipId }: { friendshipId: string }) => {
      console.log('Friend request seen:', friendshipId);
      if (!friendshipId) {
        console.error('Invalid friendshipId in seen event');
        return;
      }
      
      // Mark request as seen in store
      useFriendStore.getState().markRequestAsSeen(friendshipId);
      
      // Update incoming requests to reflect the change
      setTimeout(() => {
        useFriendStore.getState().fetchFriendRequests('incoming');
      }, 500);
    };

    const friendNotificationsClearedHandler = () => {
      console.log('Friend notifications cleared');
      // Update local state
      useFriendStore.getState().clearAllNotifications();
      
      // Refresh all requests to ensure UI sync
      setTimeout(() => {
        useFriendStore.getState().fetchFriendRequests();
      }, 500);
    };

    // Add handler for user profile updates
    const userUpdatedHandler = (data: UserUpdateEvent) => {
      console.log('User profile updated:', data);
      
      if (!data.user || !data.user._id) {
        console.error('Invalid user update data:', data);
        return;
      }
      
      const updatedUser = data.user;
      const currentUser = useAuthStore.getState().user;
      
      // If this is the current user, update auth store
      if (currentUser && currentUser._id === updatedUser._id) {
        // Update the current user's profile in auth store
        // Merge with existing user data to avoid losing fields not included in the update
        useAuthStore.getState().updateUserInStore({
          ...currentUser,
          name: updatedUser.name,
          username: updatedUser.username,
          image: updatedUser.image,
          status: updatedUser.status,
        });
      }
      
      // Update user in chat store (for conversations with this user)
      useChatStore.getState().updateUserInfo(updatedUser);
      
      // Update user in friend store (for friends list)
      useFriendStore.getState().updateFriendInfo(updatedUser);
    };

    // Add AI toggle handler
    const aiToggleHandler = (data: AIToggleEvent) => {
      console.log('AI toggled:', data);
      
      // Update chat store with new AI status
      const chatStore = useChatStore.getState();
      chatStore.chatList.forEach(chat => {
        if (chat.id === data.conversationId) {
          chat.aiEnabled = data.aiEnabled;
        }
      });
      
      // Re-render chat list
      useChatStore.setState({ chatList: [...chatStore.chatList] });
    };
    
    // Register all handlers
    socket.on(EVENTS.MESSAGE_RECEIVE, messageHandler);
    socket.on(EVENTS.USER_ONLINE, onlineHandler);
    socket.on(EVENTS.USER_OFFLINE, offlineHandler);
    socket.on(EVENTS.CHAT_MESSAGE_UPDATE, messageUpdateHandler);
    socket.on(EVENTS.USER_TYPING, typingHandler);
    socket.on(EVENTS.MESSAGE_READ_ACK, readReceiptHandler);
    socket.on(EVENTS.FRIEND_REQUEST_SENT, friendRequestHandler);
    socket.on(EVENTS.FRIEND_REQUEST_RESPONDED, friendResponseHandler);
    socket.on(EVENTS.FRIEND_REQUEST_SEEN, friendRequestSeenHandler);
    socket.on(EVENTS.FRIEND_NOTIFICATIONS_CLEARED, friendNotificationsClearedHandler);
    socket.on(EVENTS.USER_UPDATED, userUpdatedHandler);
    socket.on(EVENTS.AI_TOGGLE, aiToggleHandler);
    
    // No cleanup function - we want these handlers to persist
  }, [updateChatOnlineStatus, addNewMessage, updateLastMessageInfo, setUserTyping, markChatAsRead]);
  
  // Function to send typing status
  const sendTypingStatus = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = socketRef.current || getSocket();
    if (!socket) return;
    
    console.log('Sending typing status:', isTyping, 'for', conversationId);
    socket.emit(EVENTS.USER_TYPING, {
      conversationId,
      isTyping
    });
  }, []);
  
  // Function to mark messages as read
  const markMessagesAsRead = useCallback((conversationId: string) => {
    const socket = socketRef.current || getSocket();
    if (!socket) return;
    
    console.log('Marking messages as read in:', conversationId);
    socket.emit(EVENTS.MESSAGE_READ, {
      conversationId
    });
    
    // Also update local state
    markChatAsRead(conversationId);
  }, [markChatAsRead]);

  // Add a specific cleanup function for logout
  const cleanupSocket = useCallback(() => {
    console.log("Forcing socket disconnection and removing handlers (e.g. on logout)");
    
    // Get the socket before disconnecting
    const socket = getSocket();
    
    // Remove all event listeners before disconnecting
    if (socket) {
      Object.values(EVENTS).forEach(event => {
        socket.removeAllListeners(event);
      });
    }
    
    // Reset our global flags
    handlersRegistered = false;
    socketInitialized = false;
    
    // Disconnect the socket
    disconnectSocket(false); // Force disconnect
  }, []);

  return {
    socket: socketRef.current || getSocket(),
    sendTypingStatus,
    markMessagesAsRead,
    cleanupSocket // Export this so it can be called on logout
  };
};

export default useSocket;