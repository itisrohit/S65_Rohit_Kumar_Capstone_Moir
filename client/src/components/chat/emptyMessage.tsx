import { useState } from "react";
import { MessageCircle, Smile, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type EmptyMessageProps = {
  name?: string;
  onSendMessage?: (message: string) => void;
};

export function EmptyMessage({ name, onSendMessage }: EmptyMessageProps) {
  const [isSending, setIsSending] = useState(false);
  const greetingOptions = [
    "👋 Hey there!",
    "👋 Hello!",
    "👋 Hi there!",
    "👋 Hey, how's it going?",
    "👋 Hello! How are you?"
  ];
  
  // Select a random greeting
  const randomGreeting = greetingOptions[Math.floor(Math.random() * greetingOptions.length)];
  
  const handleSendGreeting = () => {
    if (!onSendMessage) return;
    
    setIsSending(true);
    
    // Simulate network delay
    setTimeout(() => {
      onSendMessage(randomGreeting);
      setIsSending(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-4 p-6 animate-in fade-in duration-500">
      <div className={cn(
        "w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent/50",
        "flex items-center justify-center shadow-inner transform transition-all",
        "hover:scale-110 duration-300"
      )}>
        <MessageCircle className="h-10 w-10" />
      </div>
      
      <h3 className="text-2xl font-medium text-foreground">No messages yet</h3>
      
      <p className="text-center max-w-[90%] md:max-w-[70%] text-muted-foreground">
        {name ? (
          <>This is the beginning of your conversation with <span className="font-medium text-foreground">{name}</span>. Say hello to get started!</>
        ) : (
          "Start a new conversation by sending your first message."
        )}
      </p>
      
      <div className="mt-4 space-y-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              className="gap-2 px-6 py-6 text-base font-medium h-auto" 
              onClick={handleSendGreeting}
              disabled={isSending || !onSendMessage}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Say Hello <Smile className="h-5 w-5" />
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send a friendly greeting</p>
          </TooltipContent>
        </Tooltip>
        
        {!onSendMessage && (
          <p className="text-xs text-center text-muted-foreground">
            Message sending is not configured
          </p>
        )}
      </div>
    </div>
  );
}