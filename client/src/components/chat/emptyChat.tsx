import { MessageSquare } from "lucide-react";

export function EmptyChat() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-medium">Select a conversation</h3>
      <p>Choose from your existing conversations or start a new one</p>
    </div>
  );
}