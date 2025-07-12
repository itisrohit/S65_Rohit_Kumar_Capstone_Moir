import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isTyping?: boolean;
  className?: string;
  userName?: string;
}

export function TypingIndicator({ isTyping = false, className, userName }: TypingIndicatorProps) {
  if (!isTyping) return null;
  
  return (
    <div className={cn("flex items-center gap-2 max-w-[70%] mr-auto px-4", className)}>
      <div className="flex items-center gap-1 py-1 px-2.5 rounded-full bg-muted/70">
        <div className="bg-accent-foreground/70 h-1.5 w-1.5 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
        <div className="bg-accent-foreground/70 h-1.5 w-1.5 rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
        <div className="bg-accent-foreground/70 h-1.5 w-1.5 rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
      </div>
      
      {userName && (
        <span className="text-xs text-muted-foreground">{userName} is typing</span>
      )}
    </div>
  );
}