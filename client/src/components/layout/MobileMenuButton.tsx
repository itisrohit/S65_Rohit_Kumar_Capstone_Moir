"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface MobileMenuButtonProps {
  onClick: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "custom";
  className?: string;
  icon?: "left" | "right" | React.ReactNode;
  label?: string;
  hidden?: boolean;
  variant?: "ghost" | "default" | "outline" | "secondary";
  isOpen?: boolean; // Add isOpen prop to track sidebar state
}

export function MobileMenuButton({
  onClick,
  position = "bottom-right",
  className,
  icon = "left",
  label = "Menu",
  hidden = false,
  variant = "ghost",
  isOpen = false // Default to closed state
}: MobileMenuButtonProps) {
  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "custom": "" // No position classes for custom
  };

  // Render appropriate icon
  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    return icon === "left" ? 
      <ChevronLeft className="h-5 w-5 text-muted-foreground" /> : 
      <ChevronRight className="h-5 w-5 text-muted-foreground" />;
  };

  if (hidden) return null;

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={onClick}
      className={cn(
        "fixed md:hidden h-12 w-12 rounded-full",
        "bg-background/95 backdrop-blur-sm shadow-md border border-border/60",
        "z-40", // High z-index to stay on top
        "transition-all duration-300 ease-in-out", // Add transition
        isOpen ? "rotate-180" : "rotate-0", // Add rotation based on isOpen
        positionClasses[position],
        className
      )}
      aria-label={label}
    >
      {renderIcon()}
    </Button>
  );
}

export default MobileMenuButton;