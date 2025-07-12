import  Groq  from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
  dangerouslyAllowBrowser: true 
});

// Mizuki AI personality and capabilities
const SYSTEM_PROMPT = `You are Mizuki, a friendly AI assistant in a chat app that helps keep conversations flowing.
Your personality: warm, helpful, perceptive, and slightly playful.
Your role is to:
1. Sense conversation mood and respond appropriately
2. Provide conversation starters when the chat feels stuck
3. Offer ice breakers to make interactions more engaging
4. Give brief, natural-sounding responses (under 100 words)
5. Never dominate conversations - only assist when needed
6. Remember context from previous messages

Always maintain a supportive, encouraging tone while respecting privacy.`;

// Types of assistance Mizuki can provide
export enum MizukiHelp {
  STARTER = "starter",       // General conversation starter
  ICE_BREAKER = "ice_breaker", // Fun question to engage participants
  MOOD_RESPONSE = "mood",    // Response based on conversation mood
  SUGGESTION = "suggestion", // Quick message suggestions
  DIRECT = "direct"          // Direct question answering
}

// Interface for Mizuki's responses
export interface MizukiResponse {
  text: string;
  type: MizukiHelp;
  suggestions?: string[];
}

// Format conversation for Groq API
interface MessageEntry {
  sender: 'me' | 'other' | 'ai';
  text: string;
}

// Increase at the top of the file - strengthen rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE = 3000; // Base delay for retries - longer than before
let consecutiveFailures = 0;
const MAX_FAILURES = 5; // Circuit breaker threshold

// Create a queue for requests
let isRequestInProgress = false;

/**
 * Get assistance from Mizuki based on conversation context
 */
export async function getMizukiResponse(
  conversationHistory: MessageEntry[],
  helpType: MizukiHelp = MizukiHelp.MOOD_RESPONSE,
  retryCount = 0,
  directQuestion?: string    // Add optional parameter for direct questions
): Promise<MizukiResponse> {
  // Circuit breaker pattern
  if (consecutiveFailures >= MAX_FAILURES) {
    console.warn("Mizuki AI: Too many consecutive failures, circuit breaker open");
    return getFallbackResponse(helpType);
  }
  
  // Wait if another request is in progress
  if (isRequestInProgress) {
    console.log("Request already in progress, using fallback");
    return getFallbackResponse(helpType);
  }
  
  try {
    isRequestInProgress = true;
    
    // Check time interval
    const now = Date.now();
    const timeElapsed = now - lastRequestTime;
    if (timeElapsed < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeElapsed));
    }
    
    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      console.warn("Mizuki AI: No API key found");
      return getFallbackResponse(helpType);
    }
    
    // Limit conversation history to most recent messages for context
    const recentHistory = conversationHistory.slice(-10);
    
    // Build the prompt based on requested help type
    let promptInstruction = "";
    
    switch(helpType) {
      case MizukiHelp.STARTER:
        promptInstruction = "Create an engaging conversation starter based on what you see in this chat. Be natural and friendly.";
        break;
      case MizukiHelp.ICE_BREAKER:
        promptInstruction = "Create a fun ice breaker question to make this conversation more engaging. Keep it light and interesting.";
        break;
      case MizukiHelp.MOOD_RESPONSE:
        promptInstruction = "Analyze the mood of this conversation and provide a helpful response that matches that mood. Be empathetic and supportive.";
        break;
      case MizukiHelp.SUGGESTION:
        promptInstruction = "Provide 3 brief message suggestions the user could send next. Format as a JSON array of strings. Keep each suggestion under 8 words.";
        break;
      case MizukiHelp.DIRECT:
        // Use the direct question if provided
        if (directQuestion) {
          promptInstruction = `The user has directly asked: "${directQuestion}"
          
Provide a helpful, concise response (maximum 3 sentences). Be conversational but focus on directly answering their question.`;
        } else {
          promptInstruction = "Please respond to the user's question briefly and helpfully.";
        }
        break;
    }
    
    // Format conversation history as a readable string
    const formattedHistory = recentHistory
      .map(msg => `${msg.sender === "ai" ? "Mizuki" : msg.sender === "me" ? "User1" : "User2"}: ${msg.text}`)
      .join("\n");

    // Update the last request time
    lastRequestTime = Date.now();
    
    // Call Groq API with formatted prompt
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Conversation history:\n${formattedHistory}\n\n${promptInstruction}` }
      ],
      model: "llama3-70b-8192", // Using Llama 3 for high-quality responses
      temperature: 0.7,         // Balanced creativity and coherence
      max_tokens: 200,
      stream: false,
    });

    const responseText = completion.choices[0].message.content || 
      "I'm not sure what to suggest right now.";
    
    // Handle suggestions format specially
    if (helpType === MizukiHelp.SUGGESTION) {
      try {
        // Try to parse as JSON first
        let suggestions: string[] = [];
        
        // Look for JSON array in the response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            suggestions = JSON.parse(jsonMatch[0]);
          } catch  {
            // Fall back to regex extraction if JSON parse fails
            const matches = responseText.match(/"([^"]+)"/g) || [];
            suggestions = matches.map(m => m.replace(/"/g, '')).slice(0, 3);
          }
        } else {
          // If no JSON array, extract lines or sentences
          suggestions = responseText
            .split(/[.,\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && s.length < 50)
            .slice(0, 3);
        }
        
        return {
          text: "Here are some suggestions:",
          type: helpType,
          suggestions: suggestions.length > 0 
            ? suggestions 
            : ["How's your day?", "Tell me more!", "Interesting point!"]
        };
      } catch (e) {
        console.error("Error parsing suggestions:", e);
        return {
          text: "I have some suggestions for you",
          type: helpType,
          suggestions: ["How's your day?", "Tell me more!", "Interesting point!"]
        };
      }
    }
    
    // For regular responses
    return {
      text: responseText,
      type: helpType
    };
  } catch (error: unknown) { // Change from any to unknown
    console.error("Error getting Mizuki response:", error);
    
    // Increment failures
    consecutiveFailures++;
    
    // Handle rate limiting with increased backoff
    if (
      typeof error === 'object' && 
      error !== null && 
      'status' in error && 
      error.status === 429 && 
      retryCount < MAX_RETRIES
    ) {
      // More aggressive exponential backoff
      const retryDelay = RETRY_DELAY_BASE * Math.pow(3, retryCount);
      console.log(`Rate limited. Retrying in ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      isRequestInProgress = false;
      return getMizukiResponse(conversationHistory, helpType, retryCount + 1);
    }
    
    return getFallbackResponse(helpType);
  } finally {
    isRequestInProgress = false;
  }
}

/**
 * Simplified function to get quick message suggestions
 */
export async function getSuggestions(conversationHistory: MessageEntry[]): Promise<string[]> {
  try {
    const response = await getMizukiResponse(conversationHistory, MizukiHelp.SUGGESTION);
    return response.suggestions || [];
  } catch (error: unknown) { // Change from any to unknown
    console.error("Failed to get suggestions:", error);
    return ["How are you today?", "Tell me more!", "Interesting!"];
  }
}

// Add this helper function for fallbacks
function getFallbackResponse(helpType: MizukiHelp): MizukiResponse {
  switch(helpType) {
    case MizukiHelp.SUGGESTION:
      return {
        text: "Here are some suggestions:",
        type: helpType,
        suggestions: ["How's your day going?", "Tell me more about that!", "What do you think?"]
      };
    case MizukiHelp.ICE_BREAKER:
      return {
        text: "If you could visit any place in the world right now, where would you go and why?",
        type: helpType
      };
    case MizukiHelp.STARTER:
      return {
        text: "I noticed this conversation just started. What's been the highlight of your day so far?",
        type: helpType
      };
    default:
      return {
        text: "I'm here to help keep the conversation flowing. Feel free to ask me for suggestions!",
        type: helpType
      };
  }
}

// Add a new function for direct responses
export async function getDirectResponse(
  conversationHistory: MessageEntry[], 
  question: string
): Promise<MizukiResponse> {
  // Circuit breaker pattern
  if (consecutiveFailures >= MAX_FAILURES) {
    console.warn("Mizuki AI: Too many consecutive failures, circuit breaker open");
    return {
      text: "I'm sorry, I can't respond right now. Please try again later.",
      type: MizukiHelp.MOOD_RESPONSE
    };
  }
  
  // Wait if another request is in progress
  if (isRequestInProgress) {
    console.log("Request already in progress, using fallback");
    return {
      text: "I'm processing another request. Please ask me again in a moment.",
      type: MizukiHelp.MOOD_RESPONSE
    };
  }
  
  try {
    isRequestInProgress = true;
    
    // Check time interval
    const now = Date.now();
    const timeElapsed = now - lastRequestTime;
    if (timeElapsed < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeElapsed));
    }
    
    // Check if API key is available
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      console.warn("Mizuki AI: No API key found");
      return {
        text: "I can't access my knowledge right now. Please check your connection.",
        type: MizukiHelp.MOOD_RESPONSE
      };
    }
    
    // Limit conversation history to most recent messages for context
    const recentHistory = conversationHistory.slice(-5);
    
    // Format conversation history as a readable string
    const formattedHistory = recentHistory
      .map(msg => `${msg.sender === "ai" ? "Mizuki" : msg.sender === "me" ? "User1" : "User2"}: ${msg.text}`)
      .join("\n");
    
    // Special prompt for direct questions
    const directPrompt = `The user has directly asked you: "${question}"
    
Provide a helpful, concise response (maximum 3 sentences). Be conversational but focus on directly answering their question.`;

    // Update the last request time
    lastRequestTime = Date.now();
    
    // Call Groq API with direct question
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Brief conversation context:\n${formattedHistory}\n\n${directPrompt}` }
      ],
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 150, // Limit token length for concise responses
      stream: false,
    });

    const responseText = completion.choices[0].message.content || 
      "I'm not sure how to answer that question.";
    
    // Reset failures on success
    consecutiveFailures = 0;
    
    return {
      text: responseText,
      type: MizukiHelp.MOOD_RESPONSE
    };
  } catch (error: unknown) {
    console.error("Error getting direct response from Mizuki:", error);
    
    // Increment failures
    consecutiveFailures++;
    
    return {
      text: "I'm having trouble answering that question right now. Could you try asking something else?",
      type: MizukiHelp.MOOD_RESPONSE
    };
  } finally {
    isRequestInProgress = false;
  }
}