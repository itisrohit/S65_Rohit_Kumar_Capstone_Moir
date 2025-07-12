import { useRef, useLayoutEffect } from "react";
import { Message } from "@/store/chatStore";
import { Check } from "lucide-react";
import { useMizuki } from "@/context/mizuki-context";
import { useChatStore } from "@/store/chatStore";
import { MizukiThinking } from "./mizuki-thinking";

type MessageListProps = {
  messages: Message[];
  conversationId: string;
};

export function MessageList({ messages, conversationId }: MessageListProps) {
  // Keep existing scroll handling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get Mizuki context for thinking status
  const { isThinking } = useMizuki();
  
  // Get AI status for current conversation
  const chatList = useChatStore(state => state.chatList);
  const currentChat = chatList.find(chat => chat.id === conversationId);
  const isAIEnabled = currentChat?.aiEnabled || false;
  
  const scrollToBottomImmediately = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useLayoutEffect(() => {
    scrollToBottomImmediately();
  }, [messages, isThinking]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 w-full"
    >
      {messages.map((message) => (
        <div 
          key={message.id} 
          className="flex w-full"
          style={{
            justifyContent: message.sender === 'me' ? 'flex-end' : 'flex-start'
          }}
        >
          {message.sender === 'ai' ? (
            // AI message with special styling
            <div className="max-w-[70%] rounded-xl p-3 break-words bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-900/30 border border-violet-100 dark:border-violet-900/40">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Mizuki</span>
                <span className="text-xs text-muted-foreground">{message.time}</span>
              </div>
              <p className="whitespace-normal break-words">{message.text}</p>
            </div>
          ) : (
            // Regular user message
            <div 
              className={`max-w-[70%] rounded-xl p-3 break-words ${
                message.sender === 'me' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-accent'
              }`}
            >
              <p className="whitespace-normal break-words">{message.text}</p>
              
              <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                message.sender === 'me' 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                <span>{message.time}</span>
                
                {/* Show read receipt (blue tick) only for messages sent by me */}
                {message.sender === 'me' && (
                  <div className="flex ml-1">
                    {message.read ? (
                      // Blue double check for read messages
                      <div className="flex">
                        <Check className="h-3 w-3 text-blue-400 stroke-[3]" />
                        <Check className="h-3 w-3 text-blue-400 stroke-[3] -ml-1" />
                      </div>
                    ) : (
                      // Gray single check for sent but unread
                      <Check className="h-3 w-3 text-primary-foreground/50 stroke-[3]" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Show thinking indicator when AI is processing */}
      {isAIEnabled && isThinking && (
        <div className="flex w-full justify-start">
          <MizukiThinking className="max-w-[60%]" />
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}