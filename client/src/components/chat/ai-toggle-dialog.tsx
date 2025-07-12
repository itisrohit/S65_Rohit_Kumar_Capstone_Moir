import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, Shield } from "lucide-react";
import React from "react";

interface AIToggleDialogProps {
  isOpen: boolean;
  isEnabled: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AIToggleDialog({
  isOpen,
  isEnabled,
  onClose,
  onConfirm
}: AIToggleDialogProps) {
  
  // Replace direct function call with memoized handler
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose]
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {isEnabled ? "Disable AI Assistant" : "Enable AI Assistant"}
          </DialogTitle>
          <DialogDescription>
            {isEnabled 
              ? "This will disable the AI assistant in this conversation."
              : "This will enable the AI assistant to help in this conversation."}
          </DialogDescription>
        </DialogHeader>
        
        {!isEnabled && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              By enabling AI, your conversation may be processed to provide assistance.
              We prioritize your privacy and will handle your data securely.
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>
            {isEnabled ? "Disable" : "Enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}