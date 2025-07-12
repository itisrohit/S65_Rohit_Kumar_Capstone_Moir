"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainLayout from "@/components/layout/main_layout";
import useAuth from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket"; 
import { useChatStore } from "@/store/chatStore";
import { Skeleton } from "@/components/ui/skeleton";
import { AppInitializer } from "@/components/AppInitializer";
import { MizukiProvider } from "@/context/mizuki-context"; // Import MizukiProvider

interface VLayoutProps {
  children: React.ReactNode;
}

export default function VLayout({ children }: VLayoutProps) {
  const { isAuthenticated, loading, user, verifyUser } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasVerified = useRef(false);
  const pathname = usePathname();
  const { clearSelectedChat } = useChatStore();
  const previousPathRef = useRef(pathname);

  // Initialize socket connection - this one needs to stay here
  useSocket();

  // Separate effect for hydration
  useEffect(() => {
    setIsInitialized(true);
    console.log("💧 Hydration completed");
  }, []);

  // Auth handling effect
  useEffect(() => {
    // Skip if not hydrated yet
    if (!isInitialized) {
      return;
    }

    if (isAuthenticated && !hasVerified.current) {
      hasVerified.current = true;
      verifyUser().catch(() => {
        router.replace("/auth");
      });
    } else if (!loading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, isInitialized, loading, router, verifyUser]);

  // Chat section navigation handler - keep this for navigation state
  useEffect(() => {
    if (previousPathRef.current === pathname) {
      previousPathRef.current = pathname;
      return;
    }

    const wasInChat = previousPathRef.current?.startsWith('/v/chat');
    const isInChat = pathname?.startsWith('/v/chat');
    
    if (wasInChat && !isInChat) {
      console.log("Navigated away from chat section, clearing selected chat");
      clearSelectedChat();
    }
    
    previousPathRef.current = pathname;
  }, [pathname, clearSelectedChat]);

  // Show loading state
  if (loading || !isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="w-full h-screen p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  // Not authenticated, render nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Use AppInitializer here */}
      <AppInitializer />
      
      {/* Add MizukiProvider around MainLayout */}
      <MizukiProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </MizukiProvider>
    </>
  );
}