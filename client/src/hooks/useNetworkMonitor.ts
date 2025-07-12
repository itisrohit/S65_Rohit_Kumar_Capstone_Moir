import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveRedirectUrl, getTimeoutPageUrl, getRedirectUrl, clearRedirectUrl } from '@/utility/url-helper';
import axios from 'axios';

interface NetworkMonitorOptions {
  /** Timeout duration in seconds for display on timeout page */
  timeoutDuration?: number;
  /** Whether to automatically redirect on connection loss */
  autoRedirect?: boolean;
  /** API endpoint to check for connectivity */
  apiEndpoint?: string;
}

/**
 * Combined hook for monitoring network status and handling timeouts
 */
export const useNetworkMonitor = ({
  timeoutDuration = 30,
  autoRedirect = true,
  // Default to API base URL
  apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
}: NetworkMonitorOptions = {}) => {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectingRef = useRef(false);
  
  /**
   * Check if server is reachable
   */
  const checkServerConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return true; // SSR
    
    try {
      // Use the dedicated health endpoint
      const healthEndpoint = `${apiEndpoint}/health`;
      console.log('🩺 Checking server health:', healthEndpoint);
      
      const response = await axios({
        method: 'GET',
        url: healthEndpoint,
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      console.log('✅ Server health check response:', response.status);
      return true;
    } catch (error) {
      console.log('❌ Server health check failed:', error);
      if (axios.isAxiosError(error)) {
        // If we got ANY response, the server is still up
        return error.response !== undefined;
      }
      // No response = server down
      return false;
    }
  }, [apiEndpoint]);
  
  /**
   * Handle connection loss by redirecting to timeout page
   */
  const handleConnectionLoss = useCallback(() => {
    // Prevent multiple redirects
    if (redirectingRef.current || !isOnline) return;
    
    setIsOnline(false);
    
    if (autoRedirect) {
      redirectingRef.current = true;
      saveRedirectUrl();
      router.replace(getTimeoutPageUrl(timeoutDuration));
      
      // Reset redirect flag after a delay
      setTimeout(() => {
        redirectingRef.current = false;
      }, 3000);
    }
  }, [isOnline, autoRedirect, timeoutDuration, router]);

  /**
   * Cancel the active timeout
   */
  const cancelTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  }, []);

  /**
   * Start a timeout that will redirect to timeout page if not cancelled
   */
  const startTimeout = useCallback((duration = 30000) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleConnectionLoss();
    }, duration);
    
    // Return a cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsLoading(false);
    };
  }, [handleConnectionLoss]);
  
  /**
   * Try to restore connection and return to original page
   * Returns boolean indicating if reconnection was successful
   */
  const tryReconnect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const isConnected = await checkServerConnectivity();
      
      if (isConnected) {
        // Get redirect URL first, then clear it
        const redirectUrl = getRedirectUrl();
        clearRedirectUrl();
        
        // If successful, redirect back - using replace instead of push
        setIsOnline(true);
        router.replace(redirectUrl || '/');
        return true;
      } else {
        setIsOnline(false);
        return false;
      }
    } catch {
      setIsOnline(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, checkServerConnectivity]);

  // Set up browser online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      // When browser reports online, verify with server
      checkServerConnectivity().then(isConnected => {
        setIsOnline(isConnected);
      });
    };
    
    const handleOffline = () => handleConnectionLoss();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    checkServerConnectivity().then(isConnected => {
      setIsOnline(isConnected);
    });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleConnectionLoss, checkServerConnectivity]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    isOnline,
    isLoading,
    startTimeout,
    cancelTimeout,
    tryReconnect,
    checkServerConnectivity,
    handleConnectionLoss
  };
};

export default useNetworkMonitor;