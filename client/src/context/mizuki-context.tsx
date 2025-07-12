import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { getMizukiResponse, getSuggestions, MizukiHelp } from '@/service/mizuki.service';
import { useChatStore} from '@/store/chatStore';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

interface MizukiContextType {
  isThinking: boolean;
  suggestions: string[];
  requestHelp: (conversationId: string, helpType: MizukiHelp) => Promise<string | undefined>; // Return the text instead of void
  clearSuggestions: () => void;
  askDirectQuestion: (conversationId: string, question: string) => Promise<void>;
}

const MizukiContext = createContext<MizukiContextType>({
  isThinking: false,
  suggestions: [],
  requestHelp: async () => undefined, // Update default implementation
  clearSuggestions: () => {},
  askDirectQuestion: async () => {}
});

export const useMizuki = () => useContext(MizukiContext);

interface MizukiProviderProps {
  children: ReactNode;
}

export function MizukiProvider({ children }: MizukiProviderProps) {
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // Replace useState with useRef for the timeout
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [apiFailures, setApiFailures] = useState<number>(0);
  const [lastSuggestionTime, setLastSuggestionTime] = useState<number>(0);
  
  const selectedChatId = useChatStore(state => state.selectedChatId);
  const chatMessages = useChatStore(state => state.chatMessages);
  const chatList = useChatStore(state => state.chatList);
  
  // Get the currently selected chat
  const currentChat = selectedChatId 
    ? chatList.find(chat => chat.id === selectedChatId) 
    : null;
    
  // Check if AI is enabled for current chat
  const isAIEnabled = currentChat?.aiEnabled || false;
  
  
  const formatMessagesForAI = useCallback((conversationId: string) => {
    const messages = chatMessages[conversationId] || [];
    return messages.map(msg => ({
      sender: msg.sender === 'ai' ? 'ai' as const : msg.sender,
      text: msg.text
    }));
  }, [chatMessages]);
  
  // Clear suggestions function - memoized to avoid effect dependencies changing
  const clearSuggestions = useCallback(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = null;
    }
    setSuggestions([]);
  }, []);
  
  // Request help from Mizuki
  const requestHelp = useCallback(async (conversationId: string, helpType: MizukiHelp) => {
    if (!isAIEnabled || isThinking) return undefined;
    
    try {
      setIsThinking(true);
      setSuggestions([]);
      
      // Format conversation history for AI
      const formattedMessages = formatMessagesForAI(conversationId);
      
      // Get response from Mizuki
      const response = await getMizukiResponse(formattedMessages, helpType);
      
      // Handle response based on help type
      if (helpType === MizukiHelp.SUGGESTION) {
        // Handle suggestions separately - they don't get saved to server
        if (response.suggestions && response.suggestions.length > 0) {
          setSuggestions(response.suggestions);
        }
        return undefined;
      } else {
        // For all other help types, return the response text to be placed in input
        return response.text;
      }
    } catch (error) {
      console.error('Error getting Mizuki response:', error);
      return undefined;
    } finally {
      setIsThinking(false);
    }
  }, [formatMessagesForAI, isAIEnabled, isThinking]);
  
  // Auto-suggest after periods of inactivity
  useEffect(() => {
    // Skip completely if not applicable
    if (!selectedChatId || !isAIEnabled) {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
        suggestionTimeoutRef.current = null;
      }
      return;
    }
    
    const messages = chatMessages[selectedChatId] || [];
    
    // Only proceed if we don't already have a timeout set up
    if (suggestionTimeoutRef.current !== null) {
      return;
    }
    
    const now = Date.now();
    const MIN_SUGGESTION_INTERVAL = 60000; // 60 seconds
    const timeSinceLastSuggestion = now - lastSuggestionTime;
    
    // More restrictive conditions to prevent excessive API calls
    if (messages.length >= 3 && 
        apiFailures < 3 && 
        timeSinceLastSuggestion > MIN_SUGGESTION_INTERVAL &&
        suggestions.length === 0 && 
        !isThinking) {
      
      console.log("Setting up suggestion timeout");
      const timeoutId = setTimeout(() => {
        // Use a regular function instead of async to avoid React 18 strict mode issues
        const doGetSuggestions = async () => {
          try {
            setLastSuggestionTime(Date.now());
            const formattedMessages = formatMessagesForAI(selectedChatId);
            const newSuggestions = await getSuggestions(formattedMessages);
            setSuggestions(newSuggestions);
          } catch (error: unknown) { // Change from implicit any to unknown
            console.error('Error getting suggestions:', error);
            setApiFailures(prev => prev + 1);
          } finally {
            // Clear the ref directly
            suggestionTimeoutRef.current = null;
          }
        };
        
        // Double-check conditions before proceeding
        if (!isThinking && suggestions.length === 0) {
          doGetSuggestions();
        } else {
          suggestionTimeoutRef.current = null;
        }
      }, 15000);
      
      // Set the ref directly - no re-renders
      suggestionTimeoutRef.current = timeoutId;
    }
    
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
        suggestionTimeoutRef.current = null;
      }
    };
  }, [
    selectedChatId, 
    chatMessages, 
    isAIEnabled, 
    isThinking,
    apiFailures,
    lastSuggestionTime,
    formatMessagesForAI,
    suggestions.length
  ]);
  
  // Clear suggestions when chat changes
  useEffect(() => {
    clearSuggestions();
    setApiFailures(0);
  }, [selectedChatId, clearSuggestions]);
  
  // Reset failures when component mounts or remounts
  useEffect(() => {
    // Reset API failures on component mount
    setApiFailures(0);
    return () => {
      clearSuggestions();
    };
  }, [clearSuggestions]);
  
  // Update the askDirectQuestion method
  const askDirectQuestion = useCallback(async (conversationId: string, question: string) => {
    if (!isAIEnabled || isThinking) return;
    
    try {
      setIsThinking(true);
      setSuggestions([]);
      
      // Format conversation history for AI
      const formattedMessages = formatMessagesForAI(conversationId);
      
      // Get direct question response from Mizuki
      const response = await getMizukiResponse(formattedMessages, MizukiHelp.DIRECT, 0, question);
      
      // Send the AI response to the server
      await api.post(`/conversation/send-ai/${conversationId}`, {
        text: response.text
      });
      
      // No need to add the message manually - it will come back via socket
    } catch (error) {
      console.error('Error getting direct response from Mizuki:', error);
    } finally {
      setIsThinking(false);
    }
  }, [formatMessagesForAI, isAIEnabled, isThinking]);

  return (
    <MizukiContext.Provider value={{
      isThinking,
      suggestions,
      requestHelp,
      clearSuggestions,
      askDirectQuestion // Add the new method
    }}>
      {children}
    </MizukiContext.Provider>
  );
}