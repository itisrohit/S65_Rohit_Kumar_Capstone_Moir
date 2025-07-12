import { Bot, BotOff } from "lucide-react";

interface AIToggleCommandProps {
  isEnabled: boolean;
  onSelect: () => void;
}

export function AIToggleCommand({ isEnabled, onSelect }: AIToggleCommandProps) {
  return (
    <div 
      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
      onClick={onSelect}
    >
      {isEnabled ? (
        <>
          <BotOff className="h-4 w-4" />
          <span>Disable AI Assistant</span>
        </>
      ) : (
        <>
          <Bot className="h-4 w-4" />
          <span>Enable AI Assistant</span>
        </>
      )}
    </div>
  );
}