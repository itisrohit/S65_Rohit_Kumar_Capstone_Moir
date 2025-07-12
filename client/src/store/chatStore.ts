import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Types
export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other' | 'ai'; 
  time: string;
  createdAt?: string;
  read?: boolean; // Add this field for read status
}

export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  unread: number;
  otherUserId: string;
  updatedAt: string;
  type: string;
  aiEnabled?: boolean; // Add this property
}

export interface ChatData {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  messages: Message[];
  otherUserId: string;
  lastMessage?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  type: string;
}

interface ChatListResponse {
  statusCode: number;
  data: {
    success: boolean;
    data: ChatItem[];
  };
  message: string;
  success: boolean;
}

interface SendMessageResponse {
  statusCode: number;
  data: {
    success: boolean;
    data: {
      message: Message;
      conversationId: string;
      conversation: Conversation | null;
    }
  };
  message: string;
  success: boolean;
}

interface GetMessagesResponse {
  statusCode: number;
  data: {
    success: boolean;
    data: Message[];
  };
  message: string;
  success: boolean;
}

interface ChatStore {
  // State
  chatList: ChatItem[];
  chatMessages: Record<string, Message[]>;
  selectedChatId: string | null;
  loading: boolean;
  chatLoading: boolean;
  error: string | null;
  unreadCounts: Record<string, number>;
  chatOrderCache: string[];  // Added to match mockStore
  typingUsers: Record<string, Record<string, boolean>>;
  fullHistoryLoaded: Record<string, boolean>; // Add a new state property

  // Actions
  fetchChatList: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  setSelectedChat: (chatId: string | null) => void;
  markChatAsRead: (chatId: string) => void;
  clearError: () => void;
  updateChatOrder: (chatId: string) => void;  // Added to match mockStore
  setUserTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  // Add these new methods
  addNewMessage: (conversationId: string, message: Message & { _isInActiveChat?: boolean }) => void;
  updateChatOnlineStatus: (userId: string, isOnline: boolean) => void;
  updateLastMessageInfo: (data: { id: string, lastMessage: string, timestamp: string, updatedAt: string }) => void;
  updateMessageReadStatus: (conversationId: string, messageIds?: string[]) => void; // Add this new action
  clearSelectedChat: () => void; // Add this new action
  updateUserInfo: (user: { _id: string, name: string, username: string, image: string, status: string }) => void;
  toggleAI: (conversationId: string, enabled: boolean) => Promise<void>; // Add to ChatStore interface
}

// Create the chat store
export const useChatStore = create<ChatStore>()((set, get) => ({
  // Initial state
  chatList: [],
  chatMessages: {},
  selectedChatId: null,
  loading: false,
  chatLoading: false,
  error: null,
  unreadCounts: {},
  chatOrderCache: [],  // Added to match mockStore
  typingUsers: {},
  fullHistoryLoaded: {}, // Add this new state

  // Fetch chat list from API
  fetchChatList: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get<ChatListResponse>('/conversation/chatlist');
      
      if (response.data.success) {
        const chats = response.data.data.data;
        
        // Create unread counts from fetched chats
        const unreadCounts: Record<string, number> = {};
        chats.forEach(chat => {
          unreadCounts[chat.id] = chat.unread;
        });
        
        set({
          chatList: chats,
          unreadCounts,
          loading: false
        });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chat list';
      set({ error: errorMessage, loading: false });
    }
  },

  // Fetch messages for a specific chat
  fetchMessages: async (chatId: string) => {
    try {
      set({ chatLoading: true, error: null });
      
      // Make API call to get messages for this chat
      const response = await api.get<GetMessagesResponse>(`/conversation/get/${chatId}`);
      
      if (response.data.success) {
        set(state => ({
          chatMessages: {
            ...state.chatMessages,
            [chatId]: response.data.data.data
          },
          chatLoading: false,
          fullHistoryLoaded: {
            ...state.fullHistoryLoaded,
            [chatId]: true // Mark this chat as having its full history loaded
          }
        }));
      } else {
        set({ error: response.data.message, chatLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      set({ error: errorMessage, chatLoading: false });
    }
  },

  // Send a message
  sendMessage: async (chatId: string, text: string) => {
    try {
      // First add the message optimistically to UI
      const tempId = `temp-${Date.now()}`;
      
      // Create formatted time with lowercase am/pm
      const formattedTime = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(/AM|PM/g, match => match.toLowerCase());
      
      const tempMessage: Message = {
        id: tempId,
        text,
        sender: 'me',
        time: formattedTime, // Use the lowercase formatted time
        read: false // Initialize as unread
      };
      
      // Update local state first for instant feedback
      set(state => {
        const currentMessages = state.chatMessages[chatId] || [];
        
        // Update messages
        return {
          chatMessages: {
            ...state.chatMessages,
            [chatId]: [...currentMessages, tempMessage]
          }
        };
      });
      
      // Then send to API
      const response = await api.post<SendMessageResponse>(
        `/conversation/send/${chatId}`,
        { text }
      );
      
      if (response.data.success) {
        // Update with the real message from the server response
        const sentMessage = response.data.data.data.message;
        
        set(state => {
          // Get current messages
          const currentMessages = state.chatMessages[chatId] || [];
          
          // Find and replace the temp message with the real one
          const updatedMessages = currentMessages.map(msg => 
            msg.id === tempId ? sentMessage : msg
          );
          
          // Update the chat list to show the latest message
          const updatedChatList = state.chatList.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                lastMessage: text,
                timestamp: sentMessage.time,
                updatedAt: sentMessage.createdAt || new Date().toISOString()
              };
            }
            return chat;
          });
          
          // Sort chats by updatedAt
          updatedChatList.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          
          // Update chat order cache
          const newChatOrderCache = [
            chatId,
            ...state.chatOrderCache.filter(id => id !== chatId)
          ];
          
          return {
            chatMessages: {
              ...state.chatMessages,
              [chatId]: updatedMessages
            },
            chatList: updatedChatList,
            chatOrderCache: newChatOrderCache
          };
        });
        
        // Also update the chat order
        get().updateChatOrder(chatId);
        
      } else {
        set({ error: response.data.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: errorMessage });
    }
  },

  // Set the selected chat
  setSelectedChat: (chatId: string | null) => {
    // First set the selected chat ID to update the UI immediately
    set({ selectedChatId: chatId });

    // Then handle message loading and read states
    if (chatId) {
      // Mark as read
      set(state => ({
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: 0
        },
        // Also update the chatList
        chatList: state.chatList.map(chat => 
          chat.id === chatId 
            ? { ...chat, unread: 0 } 
            : chat
        )
      }));

      // Only fetch messages if:
      // 1. We don't have any messages for this chat yet OR
      // 2. We haven't fully loaded the chat history before
      const hasMessages = get().chatMessages[chatId]?.length > 0;
      const historyFullyLoaded = get().fullHistoryLoaded[chatId];
      
      if (!hasMessages || !historyFullyLoaded) {
        console.log(`Fetching messages for chat ${chatId} - hasMessages: ${hasMessages}, historyFullyLoaded: ${historyFullyLoaded}`);
        get().fetchMessages(chatId);
      } else {
        console.log(`Using cached messages for chat ${chatId}`);
      }
    }
  },

  // Mark a chat as read
  markChatAsRead: (chatId: string) => {
    set(state => ({
      // Update the unreadCounts object
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0
      },
      // ALSO update the unread count in the chatList items
      chatList: state.chatList.map(chat => 
        chat.id === chatId 
          ? { ...chat, unread: 0 } 
          : chat
      )
    }));
    
  },
  
  // Update chat order - similar to mockStore's updateChatOrder
  updateChatOrder: (chatId: string) => {
    set(state => {
      const chatList = [...state.chatList];
      const currentChatIndex = chatList.findIndex(chat => chat.id === chatId);
      
      if (currentChatIndex >= 0) {
        // Move the selected chat to top
        const currentChat = chatList.splice(currentChatIndex, 1)[0];
        const newChatList = [currentChat, ...chatList];
        
        // Update chat order cache
        const newChatOrderCache = [
          chatId,
          ...state.chatOrderCache.filter(id => id !== chatId)
        ];
        
        return {
          chatList: newChatList,
          chatOrderCache: newChatOrderCache
        };
      }
      
      return state;
    });
  },

  // Clear any errors
  clearError: () => {
    set({ error: null });
  },

  // Add a new incoming message
  addNewMessage: (conversationId: string, message: Message & { _isInActiveChat?: boolean }) => {
    set(state => {
      const currentMessages = state.chatMessages[conversationId] || [];
      
      // Check if message with this ID already exists
      const messageExists = currentMessages.some(msg => msg.id === message.id);
      
      // Remove our special flag before adding to messages array
      const { _isInActiveChat, ...cleanMessage } = message;
      
      // Only add the message if it's unique
      const updatedMessages = messageExists 
        ? currentMessages 
        : [...currentMessages, cleanMessage];
      
      // Only increment unread if:
      // 1. Message is not in active chat (based on flag)
      // 2. Message is new (not a duplicate)
      const shouldIncrementUnread = !_isInActiveChat && !messageExists;
      
      const currentUnread = state.unreadCounts[conversationId] || 0;
      const newUnread = shouldIncrementUnread ? currentUnread + 1 : currentUnread;
      
      // Update chat list
      const updatedChatList = state.chatList.map(chat => {
        if (chat.id === conversationId) {
          return {
            ...chat,
            lastMessage: message.text,
            timestamp: message.time,
            updatedAt: message.createdAt || new Date().toISOString(),
            unread: newUnread
          };
        }
        return chat;
      }).sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      return {
        chatMessages: {
          ...state.chatMessages,
          [conversationId]: updatedMessages
        },
        chatList: updatedChatList,
        unreadCounts: {
          ...state.unreadCounts,
          [conversationId]: newUnread
        }
      };
    });
  },

  // Update chat online status
  updateChatOnlineStatus: (userId: string, isOnline: boolean) => {
    set(state => ({
      chatList: state.chatList.map(chat => 
        chat.otherUserId === userId 
          ? { ...chat, online: isOnline }
          : chat
      )
    }));
  },

  // Update last message info
  updateLastMessageInfo: (data: { id: string, lastMessage: string, timestamp: string, updatedAt: string }) => {
    set(state => {
      const updatedChatList = state.chatList.map(chat => 
        chat.id === data.id 
          ? {
              ...chat,
              lastMessage: data.lastMessage,
              timestamp: data.timestamp,
              updatedAt: data.updatedAt
            }
          : chat
      );
      
      updatedChatList.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      return { chatList: updatedChatList };
    });
  },

  // Set user typing status
  setUserTyping: (conversationId: string, userId: string, isTyping: boolean) => {
    set(state => {
      // Initialize nested maps if needed
      const conversationTyping = state.typingUsers[conversationId] || {};
      
      // Update typing status
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: {
            ...conversationTyping,
            [userId]: isTyping
          }
        }
      };
    });
  },

  // Update message read status
  updateMessageReadStatus: (conversationId: string, messageIds?: string[]) => {
    set(state => {
      const messages = state.chatMessages[conversationId] || [];
      
      // If specific messageIds are provided, only mark those as read
      // Otherwise mark all messages from 'me' as read
      const updatedMessages = messages.map(msg => {
        if (msg.sender === 'me' && (!messageIds || messageIds.includes(msg.id))) {
          return { ...msg, read: true };
        }
        return msg;
      });
      
      return {
        chatMessages: {
          ...state.chatMessages,
          [conversationId]: updatedMessages
        }
      };
    });
  },

  // Clear selected chat
  clearSelectedChat: () => {
    set({ selectedChatId: null });
    console.log("Chat state reset - selectedChatId cleared");
  },

  // Update user info in chat store
  updateUserInfo: (user: { _id: string, name: string, username: string, image: string, status: string }) => {
    set(state => {
      // Create a new chat list with updated user info
      const updatedChatList = state.chatList.map(chat => {
        if (chat.otherUserId === user._id) {
          return {
            ...chat,
            name: user.name, // Update name
            avatar: user.image, // Update avatar
            online: user.status === 'online', // Update online status
          };
        }
        return chat;
      });
      
      return { chatList: updatedChatList };
    });
    console.log('User info updated in chat store:', user._id);
  },

  // Toggle AI for a conversation
  toggleAI: async (conversationId: string, enabled: boolean) => {
    try {
      set({ error: null });
      
      // Call API to toggle AI
      const response = await api.put(`/conversation/toggle-ai/${conversationId}`, { enabled });
      
      if (response.data.success) {
        // Update chat list with new AI status
        set(state => ({
          chatList: state.chatList.map(chat => 
            chat.id === conversationId 
              ? { ...chat, aiEnabled: enabled }
              : chat
          )
        }));
      } else {
        set({ error: response.data.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle AI';
      set({ error: errorMessage });
    }
  },
}));

export default useChatStore;