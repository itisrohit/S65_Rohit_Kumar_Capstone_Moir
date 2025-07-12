"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRedirectUrl, clearRedirectUrl } from '@/utility/url-helper';

// Simple loading state for Suspense fallback
function LoadingState() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Ambient background similar to the main UI */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Pulse animation around spinner */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-blue-500/10 animate-pulse"></div>
          <div className="h-10 w-10 border-4 border-slate-700/50 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        
        <p className="mt-6 text-slate-300 font-light tracking-wide">
          Initializing connection...
        </p>
      </div>
    </div>
  );
}

// Main timeout content component
function TimeoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get duration from URL or default to 30 seconds
  const durationParam = searchParams?.get('duration');
  const defaultDuration = 30;
  const totalSeconds = durationParam ? parseInt(durationParam, 10) : defaultDuration;
  
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Calculate progress percentage
  const progress = Math.max(0, Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100));
  
  // Server connectivity check function 
  const checkServerConnectivity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
      // Use the dedicated health endpoint that returns 200
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET', // Use GET instead of HEAD
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // Server is healthy
        console.log('✅ Server health check successful, returning to app');
        const redirectUrl = getRedirectUrl();
        clearRedirectUrl();
        router.replace(redirectUrl || '/');
        return true;
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      setConnectionAttempts(prev => prev + 1);
      
      // More user-friendly error message
      const message = connectionAttempts > 2 
        ? 'Server still appears to be down. Please try again later.'
        : 'Cannot connect to server. Retrying...';
        
      setError(message);
      console.log('❌ Server health check failed:', error);
      
      // Reset countdown timer if it hit zero
      if (secondsLeft <= 0) {
        const nextInterval = Math.max(5, Math.min(15, totalSeconds - connectionAttempts * 5));
        setSecondsLeft(nextInterval);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, secondsLeft, totalSeconds, connectionAttempts]);
  
  // Countdown timer effect
  useEffect(() => {
    if (secondsLeft <= 0) {
      checkServerConnectivity();
      return;
    }
    
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [secondsLeft, checkServerConnectivity]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-xl px-6 relative z-10">
        {/* Connection status visualization */}
        <div className="flex items-center justify-center h-36 mb-6 md:mb-10 relative">
          {/* Server to client connection */}
          <div className="relative inline-flex items-center">
            {/* Server node */}
            <div className="relative group">
              <div className="w-12 h-12 rounded-xl bg-black border border-slate-800 flex items-center justify-center
                          shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
                
                {/* Server status indicator */}
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"></span>
              </div>
              
              {/* Ping animation */}
              <div className="absolute inset-0 rounded-xl border border-blue-500/20 animate-ping-slow opacity-0"></div>
            </div>
            
            {/* Connection status */}
            <div className="mx-5 h-[2px] w-[80px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/30 to-slate-800/30"></div>
              <div className="absolute top-0 left-0 h-full bg-slate-500/50 animate-pulse-width"></div>
            </div>
            
            {/* Client node */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center
                          shadow-[0_0_15px_rgba(59,130,246,0.1)] overflow-hidden">
                <svg className="h-5 w-5 text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                
                {/* Client status indicator */}
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress bar (shadcn-inspired) */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-8">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
            style={{
              width: `${progress}%`,
              transition: 'width 1s linear'
            }}
          ></div>
        </div>
        
        {/* Content */}
        <h1 className="text-2xl font-light tracking-tight text-white mb-4 text-center">
          Connection Lost
        </h1>
        
        <p className="text-slate-300 text-center mb-8 text-base">
          We&apos;re experiencing difficulty connecting to the server.
          {secondsLeft > 0 ? (
            <span> Retrying {connectionAttempts > 0 ? 'again ' : ''}in <span className="text-white font-medium">{secondsLeft}</span> seconds.</span>
          ) : (
            <span> Attempting to reconnect now...</span>
          )}
        </p>
        
        {/* Error alert (shadcn-inspired) */}
        {error && (
          <div className="mb-8 rounded-md border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-200">
            <div className="flex items-start">
              <svg className="h-4 w-4 text-red-400 mt-0.5 mr-2.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* Action button (shadcn-inspired) */}
        <button
          onClick={() => checkServerConnectivity()}
          disabled={isLoading}
          className="w-full h-11 px-6 bg-white text-slate-900 rounded-md font-medium text-sm 
                   flex items-center justify-center relative overflow-hidden
                   hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-offset-2 focus-visible:ring-white
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Reconnecting
            </>
          ) : (
            "Retry Connection"
          )}
        </button>
        
        {/* Connection attempts badge */}
        {connectionAttempts > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-slate-500"></span>
              Attempt {connectionAttempts}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 text-slate-600 text-xs font-medium">
        © MOIR {new Date().getFullYear()}
      </div>
    </div>
  );
}

export default function TimeoutPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TimeoutContent />
    </Suspense>
  );
}