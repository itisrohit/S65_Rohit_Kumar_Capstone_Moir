"use client";

import { useEffect, useState } from 'react';
import { saveRedirectUrl, getTimeoutPageUrl } from '@/utility/url-helper';

/**
 * Global component that actively monitors server connectivity
 */
export default function ConnectionMonitor() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Set up server ping system
  useEffect(() => {
    let isRedirecting = false;
    let isMounted = true;
    
    // Function to ping server
    const pingServer = async () => {
      if (!isMounted || isRedirecting) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Use the dedicated health endpoint
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET', // Simple GET request
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        clearTimeout(timeoutId);
        
        // Check if the response is successful
        if (!response.ok) {
          handleServerDown();
        }
      } catch {
        // Server is unreachable
        handleServerDown();
      }
    };
    
    // Function to handle server down situation
    const handleServerDown = () => {
      if (isRedirecting || !isMounted) return;
      
      // Prevent multiple redirects
      isRedirecting = true;
      
      // Only save URL and redirect if we're not already on the timeout page
      if (!window.location.pathname.includes('/timeout')) {
        console.log('Server appears to be down. Redirecting to timeout page...');
        
        // Show transitional overlay BEFORE saving URL and redirecting
        setIsTransitioning(true);
        
        // Save current URL
        saveRedirectUrl();
        
        // Short delay to ensure overlay appears before redirect
        setTimeout(() => {
          window.location.href = getTimeoutPageUrl(30);
        }, 50);
      }
    };
    
    // Start monitoring
    const pingInterval = setInterval(pingServer, 10000); // Check every 10 seconds
    
    // Run initial check
    pingServer();
    
    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(pingInterval);
    };
  }, []);

  // Render transitional overlay if needed
  if (isTransitioning) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300">
        <div className="max-w-md w-full mx-auto p-6">
          {/* Elegant connection visualization */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-10">
              {/* Connection status dots */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute left-2/4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-500 rounded-full"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-700 rounded-full"></div>
              
              {/* Connection line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 bg-gradient-to-r from-blue-500 via-blue-400 to-slate-700"></div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-white mb-2 text-center">Connection Interrupted</h3>
          <p className="text-sm text-slate-300 text-center">
            Redirecting to connection recovery...
          </p>
        </div>
      </div>
    );
  }

  return null; // No UI when not transitioning
}