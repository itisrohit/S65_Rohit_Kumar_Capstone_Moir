import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

export function MessageSuggestions({ suggestions, onSelectSuggestion }: MessageSuggestionsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2 px-2 py-2 mb-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>Try:</span>
      </div>
      
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className={cn(
            "text-xs py-1 h-auto transition-all border-dashed",
            hoveredIndex === index ? "border-primary bg-accent" : ""
          )}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => onSelectSuggestion(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}