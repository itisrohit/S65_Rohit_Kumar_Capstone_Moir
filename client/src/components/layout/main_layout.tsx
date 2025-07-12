"use client";

import { Sidebar, SidebarContext } from "@/components/layout/sidebar";
import { useState, useEffect } from "react";
import { MobileMenuButton } from "./MobileMenuButton";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Control sidebar visibility
  const [visible, setVisible] = useState(false); 
  const [messageViewActive, setMessageViewActive] = useState(false);
  const pathname = usePathname();
  
  // Reset messageViewActive when navigating away from chat section
  useEffect(() => {
    // Check if we're not in the chat section
    if (!pathname.startsWith('/v/chat')) {
      setMessageViewActive(false);
    }
  }, [pathname]);
  
  const toggleSidebar = () => {
    setVisible(prev => !prev);
  };

  // Enhanced button visibility logic
  // 1. Always show on main chat page
  // 2. Hide when viewing a specific chat on mobile
  const isMainChatPage = pathname === "/v/chat";
  const showMenuButton = isMainChatPage || !messageViewActive;

  return (
    <SidebarContext.Provider value={{ 
      toggleSidebar, 
      isVisible: visible, 
      messageViewActive, 
      setMessageViewActive 
    }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Application Sidebar */}
        <Sidebar />  
        
        {/* Mobile Menu Button with improved visibility logic */}
        {showMenuButton && (
          <MobileMenuButton
            onClick={toggleSidebar}
            position="bottom-right"
            icon="left"
            isOpen={visible}
          />
        )}
        
        {/* Main Content Container */}
        <div className="flex flex-1 h-screen overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}