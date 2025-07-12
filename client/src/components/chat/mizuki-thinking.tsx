import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface MizukiThinkingProps {
  className?: string;
}

export function MizukiThinking({ className }: MizukiThinkingProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground",
      "mx-auto bg-muted/50 rounded-lg px-4 py-2 max-w-[60%]",
      className
    )}>
      <Bot className="h-4 w-4 animate-pulse" />
      <div className="flex items-center">
        <span>Mizuki is thinking</span>
        <span className="ml-1 inline-flex">
          <span className="animate-bounce mx-[1px] delay-0">.</span>
          <span className="animate-bounce mx-[1px] delay-150">.</span>
          <span className="animate-bounce mx-[1px] delay-300">.</span>
        </span>
      </div>
    </div>
  );
}