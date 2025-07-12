import { ChatHeader } from "./chatHeader";
import { MessageList } from "./messageList";
import { MessageInput } from "./messageInput";
import { EmptyChat } from "./emptyChat";
import { EmptyMessage } from "./emptyMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatData, useChatStore } from "@/store/chatStore";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useRef, useState } from "react";
import { TypingIndicator } from "./typing-indicator"; // Import the component

type MessageLayoutProps = {
  selectedChatId: string | null; 
  chatData?: ChatData;
  onSendMessage: (message: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  chatLoading?: boolean;
};

export function MessageLayout({
  selectedChatId,
  chatData,
  onSendMessage,
  onBack,
  showBackButton = false,
  chatLoading = false
}: MessageLayoutProps) {
  const { typingUsers, unreadCounts } = useChatStore();
  const { markMessagesAsRead } = useSocket();
  
  const hasMarkedAsReadRef = useRef<Record<string, boolean>>({});


  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!selectedChatId || !chatData) {
      setIsOtherUserTyping(false);
      return;
    }
    
    const otherUserId = chatData.otherUserId;
    const conversationTyping = typingUsers[selectedChatId];
    
    // Debugging logs
    console.log('🔍 Checking typing status:', {
      conversationId: selectedChatId,
      otherUserId,
      typingStatus: conversationTyping?.[otherUserId]
    });
    
    // Check if the other user is typing
    const typing = !!conversationTyping && 
                   !!otherUserId && 
                   !!conversationTyping[otherUserId];
    
    setIsOtherUserTyping(typing);
  }, [selectedChatId, chatData, typingUsers]);

  useEffect(() => {
    if (
      selectedChatId && 
      chatData && 
      !chatLoading && 
      unreadCounts[selectedChatId] > 0 && 
      !hasMarkedAsReadRef.current[selectedChatId]
    ) {
      hasMarkedAsReadRef.current[selectedChatId] = true;
      markMessagesAsRead(selectedChatId);
    }
  }, [selectedChatId, chatLoading, markMessagesAsRead, chatData, unreadCounts]);

  useEffect(() => {
    if (selectedChatId) {
      hasMarkedAsReadRef.current = {};
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (
      selectedChatId && 
      chatData?.messages && 
      chatData.messages.length > 0 && 
      unreadCounts[selectedChatId] > 0
    ) {
      const timer = setTimeout(() => {
        console.log('Messages changed, marking as read:', selectedChatId);
        markMessagesAsRead(selectedChatId);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [chatData?.messages, selectedChatId, unreadCounts, markMessagesAsRead]);

  useEffect(() => {
    if (
      selectedChatId && 
      chatData && 
      !chatLoading && 
      unreadCounts[selectedChatId] > 0
    ) {
      console.log('Initial read marking for chat:', selectedChatId);
      markMessagesAsRead(selectedChatId);
    }
  }, [selectedChatId, chatLoading, markMessagesAsRead, chatData, unreadCounts]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {(selectedChatId !== null || !showBackButton) && (
        <>
          {selectedChatId !== null && chatData ? (
            <>
              <ChatHeader 
                name={chatData.name} 
                avatar={chatData.avatar || ""} 
                online={chatData.online}
                onBack={onBack}
                showBackButton={showBackButton}
              />
              
              {chatLoading ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div 
                      key={item} 
                      className={`flex ${item % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                    >
                      <Skeleton 
                        className={`rounded-xl p-4 ${
                          item % 2 === 0 ? 'ml-auto' : 'mr-auto'
                        }`}
                        style={{ width: `${Math.max(120, Math.random() * 200)}px`, height: '40px' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                chatData.messages && chatData.messages.length > 0 ? (
                  <MessageList 
                    messages={chatData.messages} 
                    conversationId={selectedChatId || ""}
                  />
                ) : (
                  chatData.lastMessage ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {[1, 2, 3].map((item) => (
                        <div 
                          key={item} 
                          className={`flex ${item % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                        >
                          <Skeleton 
                            className={`rounded-xl p-4 ${
                              item % 2 === 0 ? 'ml-auto' : 'mr-auto'
                            }`}
                            style={{ width: `${Math.max(120, Math.random() * 200)}px`, height: '40px' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyMessage 
                      name={chatData.name} 
                      onSendMessage={onSendMessage} 
                    />
                  )
                )
              )}
              
              <TypingIndicator 
                isTyping={isOtherUserTyping} 
                className="px-4 pb-1" 
                userName={chatData?.name}
              />

              <MessageInput 
                onSendMessage={onSendMessage} 
                conversationId={selectedChatId || ""}
              />
            </>
          ) : (
            <EmptyChat />
          )}
        </>
      )}
    </div>
  );
}