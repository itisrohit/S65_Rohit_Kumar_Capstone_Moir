"use client";

import ChatLayout from "@/components/chat/chatLayout";
import { useEffect } from "react";
import { useChatStore } from '@/store/chatStore';
import { usePathname } from "next/navigation";

export default function ChatPage() {
  const { fetchChatList, chatList, clearSelectedChat, selectedChatId } = useChatStore();
  const pathname = usePathname();
  
  // Fetch chat list when needed
  useEffect(() => {
    if (chatList.length === 0) {
      console.log("Chat list empty, fetching...");
      fetchChatList();
    }
  }, [fetchChatList, chatList.length]);
  
  // Clear selected chat when directly on /v/chat (keep this)
  useEffect(() => {
    if (pathname === "/v/chat" && selectedChatId !== null) {
      console.log("On main chat route, clearing selected chat");
      clearSelectedChat();
    }
  }, [pathname, selectedChatId, clearSelectedChat]);
  
  // Remove the cleanup function - it's now handled in the layout
  
  return <ChatLayout initialChatId={null} />;
}