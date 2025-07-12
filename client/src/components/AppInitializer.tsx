"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useFriendStore } from "@/store/friendStore";
import { useChatStore } from "@/store/chatStore";

// Export the global flag so other components can check it
export const GLOBAL_APP_INITIALIZED = { value: false };

/**
 * Component that initializes all real-time functionality when the app starts
 */
export function AppInitializer() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Only run once and only when authenticated
    if (GLOBAL_APP_INITIALIZED.value || !isAuthenticated || !user) {
      return;
    }

    console.log("🌐 Initializing global app state and real-time features");
    
    // Initialize friends data
    const friendStore = useFriendStore.getState();
    Promise.all([
      friendStore.fetchFriendRequests(),
      friendStore.fetchFriends()
    ]).then(() => {
      console.log("✅ Friends data initialized");
    });

    // Initialize chat data
    const chatStore = useChatStore.getState();
    chatStore.fetchChatList().then(() => {
      console.log("✅ Chat data initialized");
      // Mark as initialized only after data is actually loaded
      GLOBAL_APP_INITIALIZED.value = true;
    });

    // Set up periodic friend refresh
    const friendRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Global friend refresh running');
        friendStore.fetchFriendRequests();
        
        // Less frequent refresh for friends list
        if (Math.random() > 0.7) {
          friendStore.fetchFriends();
        }
      }
    }, 10000);

    // Add visibility change handler for resuming updates
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing data');
        friendStore.fetchFriendRequests();
        friendStore.fetchFriends();
        chatStore.fetchChatList();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up on page unload
    const cleanup = () => {
      clearInterval(friendRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      GLOBAL_APP_INITIALIZED.value = false;
    };

    window.addEventListener('beforeunload', cleanup);
    
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      // Don't run the cleanup on component unmount, only on actual page unload
    };
  }, [isAuthenticated, user]);

  return null; // This component doesn't render anything
}