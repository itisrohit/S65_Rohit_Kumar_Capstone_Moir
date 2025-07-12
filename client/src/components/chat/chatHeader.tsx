import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ChatHeaderProps = {
  name: string;
  avatar: string;
  online: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
};

export function ChatHeader({ name, avatar, online, onBack, showBackButton = false }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between h-[73px] p-4 border-b">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-1 md:hidden" 
            onClick={onBack} 
            aria-label="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>
          
          {/* Add online indicator */}
          {online && (
            <span 
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"
              aria-hidden="true"
            />
          )}
        </div>
        
        <div>
          <h2 className="font-medium">{name}</h2>
          <p className="text-xs flex items-center gap-1.5">
            {online ? (
              <>
                <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
              </>
            ) : (
              <span className="text-muted-foreground">Offline</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}