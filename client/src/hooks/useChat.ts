import { useState, useEffect, useCallback, useMemo} from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket'; 
import type { ChatItem, ChatData } from '@/store/chatStore';

// IMPORTANT: Import the global initialization flag from AppInitializer instead
import { GLOBAL_APP_INITIALIZED } from '@/components/AppInitializer';

export function useChat(initialChatId: string | null = null) {
  const { 
    chatList, 
    chatMessages, 
    selectedChatId,   
    error,  
    fetchChatList, 
    setSelectedChat, 
    sendMessage,
    updateChatOrder,
  } = useChatStore();
  
  const { markMessagesAsRead } = useSocket();
  
  // Use the shared global initialization state
  const [chatLoading, setChatLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(GLOBAL_APP_INITIALIZED.value);
  const router = useRouter();
  
  // Check if chat list has been loaded but not yet initialized
  useEffect(() => {
    if (chatList.length > 0 && !isInitialized) {
      console.log("Chat list already populated, marking as initialized");
      setIsInitialized(true);
    }
  }, [chatList.length, isInitialized]);

  // Safety fetch for chat list if needed
  useEffect(() => {
    const initialize = async () => {
      // Only fetch if not already initialized AND chat list is empty
      if (!isInitialized && chatList.length === 0) {
        console.log("Safety fetch: chat list empty, fetching...");
        await fetchChatList();
        setIsInitialized(true);
      }
    };
    
    initialize();
  }, [fetchChatList, chatList.length, isInitialized]);

  // Handle initialChatId from URL
  useEffect(() => {
    if (initialChatId) {
      console.log("Setting initial chat ID from URL:", initialChatId);
      setSelectedChat(initialChatId);
    }
  }, [initialChatId, setSelectedChat]);

  // Selected chat data memoized
  const selectedChat = useMemo(() => 
    chatList.find(chat => chat.id === selectedChatId),
    [chatList, selectedChatId]
  );

  // Chat data for the selected chat
  const chatData: ChatData | undefined = useMemo(() => {
    if (!selectedChat) return undefined;
    
    const messages = chatMessages[selectedChat.id] || [];
    const lastMessage = messages.length > 0 ? 
      messages[messages.length - 1].text : 
      selectedChat.lastMessage || "No messages yet";
    
    return {
      id: selectedChat.id,
      name: selectedChat.name,
      avatar: selectedChat.avatar,
      online: selectedChat.online,
      messages: messages,
      otherUserId: selectedChat.otherUserId,
      lastMessage
    };
  }, [selectedChat, chatMessages]);

  // Update your chat selection logic
  const handleSelectChat = useCallback((chat: ChatItem) => {
    console.log("Selecting chat:", chat.id);
    
    // Check if we already have messages and history for this chat
    const hasMessages = chatMessages[chat.id]?.length > 0;
    const historyFullyLoaded = useChatStore.getState().fullHistoryLoaded[chat.id];
    const needsFetching = !hasMessages || !historyFullyLoaded;
    
    // Only show loading if we need to fetch messages
    if (needsFetching) {
      setChatLoading(true);
    }
    
    // Update chat selection in store - this will trigger fetching messages
    setSelectedChat(chat.id);
    
    // Use router.replace for better navigation without remounting
    router.replace(`/v/chat/${chat.id}`);
    
    // Mark messages as read (both in store and via socket)
    markMessagesAsRead(chat.id);
    
    // Only set a timeout to clear loading if we actually set it
    if (needsFetching) {
      setTimeout(() => {
        setChatLoading(false);
      }, 500);
    }
  }, [setSelectedChat, router, markMessagesAsRead, chatMessages]);

  return {
    chatList,
    selectedChat,
    chatData,
    // Simplified loading state
    loading: !isInitialized && chatList.length === 0,
    chatLoading,
    error,
    isInitialized,
    handleSelectChat,
    handleBackButton: useCallback(() => {
      setSelectedChat(null);
      router.replace("/v/chat");
    }, [setSelectedChat, router]),
    handleSendMessage: useCallback((message: string) => {
      if (selectedChatId) {
        sendMessage(selectedChatId, message);
        updateChatOrder(selectedChatId);
      }
    }, [selectedChatId, sendMessage, updateChatOrder])
  };
}

export default useChat;