import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, Sparkles} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { AIToggleCommand } from "./ai-toggle-command";
import { AIToggleDialog } from "./ai-toggle-dialog";
import { MessageSuggestions } from "./message-suggestions";
import { useChatStore } from "@/store/chatStore";
import { useMizuki } from "@/context/mizuki-context";
import { MizukiHelp } from "@/service/mizuki.service";

type MessageInputProps = {
  onSendMessage: (message: string) => void;
  conversationId: string;
};

export function MessageInput({ onSendMessage, conversationId }: MessageInputProps) {
  const [messageInput, setMessageInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showAIToggleDialog, setShowAIToggleDialog] = useState(false);
  const { sendTypingStatus } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get AI status for the current conversation
  const chatList = useChatStore((state) => state.chatList);
  const toggleAI = useChatStore((state) => state.toggleAI);
  
  const currentChat = chatList.find(chat => chat.id === conversationId);
  const isAIEnabled = currentChat?.aiEnabled || false;
  
  // Get Mizuki context
  const { suggestions, isThinking, requestHelp, clearSuggestions, askDirectQuestion } = useMizuki();
  
  // Check for slash commands and @ mentions
  useEffect(() => {
    // Check for slash commands
    if (messageInput === '/') {
      setShowCommands(true);
      setShowMentions(false);
    } else {
      setShowCommands(false);
    }
    
    // Check for @ mentions
    if (messageInput === '@' && isAIEnabled) {
      setShowMentions(true);
      setShowCommands(false);
    } else {
      setShowMentions(false);
    }
  }, [messageInput, isAIEnabled]);
  
  // Create a separate effect for clearing suggestions
  useEffect(() => {
    if (messageInput && suggestions.length > 0) {
      clearSuggestions();
    }
  }, [messageInput, clearSuggestions, suggestions.length]);
  
  // Typing effect code
  useEffect(() => {
    if (conversationId) {
      // When message input has content, set typing to true
      if (messageInput.trim()) {
        // Set typing to true
        sendTypingStatus(conversationId, true);
        
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing indicator after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingStatus(conversationId, false);
        }, 2000);
      } 
      // When input is empty, immediately set typing to false
      else {
        sendTypingStatus(conversationId, false);
        
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageInput, conversationId, sendTypingStatus]);
  
  // Stop typing indicator when component unmounts
  useEffect(() => {
    return () => {
      if (conversationId) {
        sendTypingStatus(conversationId, false);
      }
    };
  }, [conversationId, sendTypingStatus]);
  
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Check if this is a direct question to Mizuki
    if (isAIEnabled && messageInput.startsWith('@Mizuki ')) {
      const question = messageInput.substring(8).trim(); // Remove '@Mizuki ' prefix
      if (question) {
        // Send the user's message first
        onSendMessage(messageInput);
        // Then process the AI response
        askDirectQuestion(conversationId, question);
        setMessageInput("");
        clearSuggestions();
        sendTypingStatus(conversationId, false);
        return;
      }
    }
    
    // Regular message handling
    onSendMessage(messageInput);
    setMessageInput("");
    clearSuggestions();
    sendTypingStatus(conversationId, false);
  };
  
  const handleAIToggle = () => {
    setShowCommands(false);
    setMessageInput("");
    setShowAIToggleDialog(true);
  };
  
  // Memoize the confirm handler
  const confirmAIToggle = useCallback(async () => {
    setShowAIToggleDialog(false); // First close the dialog
    await toggleAI(conversationId, !isAIEnabled); // Then update AI status
  }, [conversationId, isAIEnabled, toggleAI]);
  
  // Memoize the close handler
  const handleCloseDialog = useCallback(() => {
    setShowAIToggleDialog(false);
  }, []);
  
  const handleSelectSuggestion = (suggestion: string) => {
    setMessageInput(suggestion);
    clearSuggestions();
    // Focus the input
    const inputElement = document.querySelector('input[placeholder^="Type a message"]');
    if (inputElement) {
      (inputElement as HTMLInputElement).focus();
    }
  };
  
  // Add this new function to handle selecting Mizuki
  const handleSelectMizuki = () => {
    setMessageInput('@Mizuki ');
    setShowMentions(false);
    
    // Focus the input
    const inputElement = document.querySelector('input[placeholder^="Type a message"]');
    if (inputElement) {
      (inputElement as HTMLInputElement).focus();
    }
  };
  
  // Update the button click handlers
  const handleIceBreaker = async () => {
    const response = await requestHelp(conversationId, MizukiHelp.ICE_BREAKER);
    if (response) {
      setMessageInput(response);
      // Focus the input
      const inputElement = document.querySelector('input[placeholder^="Type a message"]');
      if (inputElement) {
        (inputElement as HTMLInputElement).focus();
      }
    }
  };

  const handleConversationStarter = async () => {
    const response = await requestHelp(conversationId, MizukiHelp.STARTER);
    if (response) {
      setMessageInput(response);
      // Focus the input
      const inputElement = document.querySelector('input[placeholder^="Type a message"]');
      if (inputElement) {
        (inputElement as HTMLInputElement).focus();
      }
    }
  };
  
  return (
    <div className="p-4 border-t bg-background/80 backdrop-blur-sm relative">
      {showCommands && (
        <div className="absolute bottom-full left-4 mb-2 bg-background border rounded-md shadow-lg p-2 w-64 z-10">
          <AIToggleCommand isEnabled={isAIEnabled} onSelect={handleAIToggle} />
        </div>
      )}
      
      {/* Show mentions menu */}
      {showMentions && isAIEnabled && (
        <div className="absolute bottom-full left-4 mb-2 bg-background border rounded-md shadow-lg p-2 w-64 z-10">
          <div 
            className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
            onClick={handleSelectMizuki}
          >
            <Bot className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Mizuki</span>
            <span className="text-xs text-muted-foreground ml-auto">AI Assistant</span>
          </div>
        </div>
      )}
      
      <AIToggleDialog 
        isOpen={showAIToggleDialog}
        isEnabled={isAIEnabled}
        onClose={handleCloseDialog}
        onConfirm={confirmAIToggle}
      />
      
      {/* Show message suggestions when available */}
      {isAIEnabled && suggestions.length > 0 && (
        <MessageSuggestions 
          suggestions={suggestions} 
          onSelectSuggestion={handleSelectSuggestion} 
        />
      )}
      
      <div className="flex items-center gap-2 p-2 rounded-xl bg-accent/30 border">
        {/* Only show AI action buttons when AI is enabled */}
        {isAIEnabled && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 hover:bg-accent flex-shrink-0"
              onClick={handleIceBreaker}
              disabled={isThinking}
              title="Ask for an ice breaker"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 hover:bg-accent flex-shrink-0"
              onClick={handleConversationStarter}
              disabled={isThinking}
              title="Ask for a conversation starter"
            >
              <Bot className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <Input 
          placeholder={isAIEnabled 
            ? "Type a message... (Type @ to mention Mizuki)" 
            : "Type a message... (Type / for commands)"
          } 
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isThinking && handleSendMessage()}
        />
        <Button 
          size="icon" 
          className={cn(
            "rounded-lg h-9 w-9 transition-all duration-200",
            messageInput.trim() 
              ? "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary" 
              : "bg-accent/50 text-muted-foreground hover:bg-accent/70"
          )}
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || isThinking}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}