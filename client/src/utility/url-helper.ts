/**
 * URL and redirect utilities for timeout handling
 */

const REDIRECT_URL_KEY = 'redirect_url';

/**
 * Saves URL for later redirection
 */
export const saveRedirectUrl = (url?: string): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const urlToSave = url || window.location.pathname + window.location.search;
    localStorage.setItem(REDIRECT_URL_KEY, urlToSave);
  } catch (e) {
    console.error("Error saving redirect URL:", e);
  }
};

/**
 * Gets the saved redirect URL
 */
export const getRedirectUrl = (): string => {
  try {
    if (typeof window === 'undefined') return '/';
    return localStorage.getItem(REDIRECT_URL_KEY) || '/';
  } catch (e) {
    console.error("Error getting redirect URL:", e);
    return '/';
  }
};

/**
 * Clears the saved redirect URL
 */
export const clearRedirectUrl = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REDIRECT_URL_KEY);
  } catch (e) {
    console.error("Error clearing redirect URL:", e);
  }
};

/**
 * Creates URL for timeout page with parameters
 */
export const getTimeoutPageUrl = (timeoutDuration: number, returnUrl?: string): string => {
  try {
    const currentUrl = typeof window !== 'undefined' 
      ? window.location.pathname + window.location.search
      : '/';
    
    const returnPath = encodeURIComponent(returnUrl || currentUrl);
    return `/timeout?duration=${timeoutDuration}&return=${returnPath}`;
  } catch (e) {
    console.error("Error creating timeout URL:", e);
    return '/timeout?duration=30';
  }
};