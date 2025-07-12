"use client";

import { useChat } from '@/hooks/useChat';
import { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/components/layout/sidebar";
import ChatList from "./chatList";
import { MessageLayout } from "./messageLayout";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatLayoutProps {
  initialChatId?: string | null;
}

export default function ChatLayout({ initialChatId = null }: ChatLayoutProps) {
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const { setMessageViewActive } = useSidebar();
  // Add a ref to track initial chat selection
  const initialSelectionMadeRef = useRef<boolean>(false);
  
  // Replace useMock with useChat
  const {
    chatList,
    selectedChat,
    chatData,
    loading,
    chatLoading, 
    isInitialized,
    handleSelectChat,
    handleBackButton,
    handleSendMessage
  } = useChat(initialChatId);

  // Check if mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);
  
  // Update message view active state when selected chat changes
  useEffect(() => {
    if (isMobileView) {
      setMessageViewActive(selectedChat !== null);
    }
  }, [selectedChat, isMobileView, setMessageViewActive]);

  // Add this debugging
  useEffect(() => {
    console.log("ChatLayout render state:", { loading, isInitialized });
  }, [loading, isInitialized]);
  
  // Make sure selectedChat is properly initialized - MOVED UP HERE
  useEffect(() => {
    // Only perform initial selection once
    if (!initialSelectionMadeRef.current && isInitialized) {
      if (initialChatId && chatList.length > 0) {
        const chatToSelect = chatList.find(chat => chat.id === initialChatId);
        if (chatToSelect) {
          handleSelectChat(chatToSelect);
        }
        initialSelectionMadeRef.current = true;
      } else if (isMobileView) {
        // Force selectedChat to null for mobile view initial state
        handleBackButton();
        initialSelectionMadeRef.current = true;
      }
    }
  }, [initialChatId, chatList, isMobileView, isInitialized, handleSelectChat, handleBackButton]);
  
  // Force exit loading state if stuck for too long
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log("Forcing exit from loading state after timeout");
        // This is just for debugging and should be removed in production
        // It will force the component to render something after 2 seconds
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Add this to force null selectedChat on direct navigation to /v/chat
  useEffect(() => {
    // If we're on /v/chat (no specific chat ID) and in mobile view,
    // ensure selectedChat is null to show the chat list
    if (!initialChatId && isMobileView) {
      handleBackButton();
    }
  }, [initialChatId, isMobileView, handleBackButton]);

  // Show loading state
  if (loading) {
    console.log("Rendering loading skeleton");
    return (
      <div className="flex w-full h-screen overflow-hidden">
        {/* Skeleton for chat list */}
        <div className="w-80 border-r bg-background flex-shrink-0 hidden md:block">
          {/* Skeleton header */}
          <div className="h-[73px] p-4 border-b">
            <Skeleton className="w-full h-9" />
          </div>
          
          {/* Skeleton chat items */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center p-4 gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Only show message skeleton if we have an initialChatId */}
        <div className="flex-1 flex flex-col">
          {initialChatId ? (
            // Show message area skeleton only when there's a chat to load
            <>
              {/* Skeleton header */}
              <div className="h-[73px] p-4 border-b flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              
              {/* Skeleton message area */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div 
                      key={item} 
                      className={`flex ${item % 2 === 0 ? 'justify-end' : ''}`}
                    >
                      <Skeleton 
                        className={`rounded-lg p-4 ${
                          item % 2 === 0 ? 'ml-auto' : ''
                        }`}
                        style={{ width: `${Math.max(120, Math.random() * 200)}px`, height: '40px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Skeleton input area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-11 rounded-md" />
                  <Skeleton className="h-11 w-11 rounded-md" />
                </div>
              </div>
            </>
          ) : (
            // Show an empty state instead when no chat is selected
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (!isInitialized) {
    console.log("Initialized but not ready");
    return (
      <div className="flex w-full h-screen overflow-hidden">
        {/* Skeleton for chat list */}
        <div className="w-80 border-r bg-background flex-shrink-0 hidden md:block">
          {/* Skeleton header */}
          <div className="h-[73px] p-4 border-b">
            <Skeleton className="w-full h-9" />
          </div>
          
          {/* Skeleton chat items */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center p-4 gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Default empty state skeleton for message area */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Mobile view container */}
      {isMobileView ? (
        <div className={cn("relative w-full h-full")}>
          {!selectedChat ? (
            // Pass only what's needed - chatList is now managed internally
            <ChatList 
              onSelectChat={handleSelectChat}
              mobileView={true}
              selectedChatId={null}
              // chatList prop removed - component subscribes directly to the store
            />
          ) : (
            // Show ONLY message layout when a chat is selected
            <MessageLayout
              selectedChatId={selectedChat?.id || null}
              chatData={chatData}
              onSendMessage={handleSendMessage}
              onBack={handleBackButton}
              showBackButton={true}
              chatLoading={chatLoading}
            />
          )}
        </div>
      ) : (
        // Desktop view remains unchanged
        <>
          <ChatList 
            onSelectChat={handleSelectChat}
            mobileView={false}
            selectedChatId={selectedChat?.id || null}
            // chatList prop removed here too
          />
          
          <MessageLayout
            selectedChatId={selectedChat?.id || null}
            chatData={chatData}
            onSendMessage={handleSendMessage}
            showBackButton={false}
            chatLoading={chatLoading}
          />
        </>
      )}
    </div>
  );
}