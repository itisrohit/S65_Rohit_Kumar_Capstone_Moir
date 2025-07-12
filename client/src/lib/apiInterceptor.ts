import axios from 'axios';
import { saveRedirectUrl, getTimeoutPageUrl } from '@/utility/url-helper';

// Default timeout for API requests (in milliseconds)
const DEFAULT_TIMEOUT = 15000; // 15 seconds

// Configure global axios defaults
axios.defaults.timeout = DEFAULT_TIMEOUT;

// Global flag to prevent multiple redirects
let isRedirecting = false;

// Function to handle connection errors
const handleConnectionError = () => {
  // Prevent multiple redirects
  if (isRedirecting) return;
  isRedirecting = true;
  
  // Save current URL for return navigation
  saveRedirectUrl();
  
  // Get the window object safely (for SSR compatibility)
  if (typeof window !== 'undefined') {
    // Create and append a transition overlay to prevent flashing
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[9999] bg-white flex items-center justify-center flex-col';
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 0.3s ease';
    
    const spinner = document.createElement('div');
    spinner.className = 'h-8 w-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4';
    
    const text = document.createElement('p');
    text.className = 'text-gray-700';
    text.textContent = 'Connecting to server...';
    
    overlay.appendChild(spinner);
    overlay.appendChild(text);
    document.body.appendChild(overlay);
    
    // Short delay to ensure overlay appears before redirect
    setTimeout(() => {
      // Redirect to timeout page (30 seconds default)
      window.location.href = getTimeoutPageUrl(30);
    }, 50);
    
    // Reset the redirect flag after some time
    setTimeout(() => {
      isRedirecting = false;
    }, 5000);
  }
};

// Add a response interceptor to handle timeouts and connection errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle connection errors and timeouts
    if (
      error.code === 'ECONNABORTED' || 
      error.message === 'Network Error' || 
      !window.navigator.onLine ||
      (error.response && (
        error.response.status === 0 ||
        error.response.status === 502 || 
        error.response.status === 503 || 
        error.response.status === 504 ||
        error.response.status === 408
      ))
    ) {
      handleConnectionError();
    }
    
    return Promise.reject(error);
  }
);

export default axios;