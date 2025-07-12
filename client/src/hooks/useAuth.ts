import { useCallback, useEffect, useRef } from "react";
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";

export const useAuth = () => {
    const store = useAuthStore();
    const router = useRouter();
    
    // Add a ref to track verification attempts
    const verificationAttemptedRef = useRef(false);
    
    const { user, isAuthenticated, loading, error } = store;

    useEffect(() => {
        // Only verify if authenticated, no user, and we haven't tried verification yet
        if (isAuthenticated && !user && !verificationAttemptedRef.current) {
            verificationAttemptedRef.current = true;
            store.verifyUser();
        }
    }, [isAuthenticated, user, store]);

    const requireAuth = useCallback((redirectPath = '/auth') => {
        if (!isAuthenticated && !loading) {
            router.replace(redirectPath); // Changed from router.push to router.replace
            return false;
        }
        return true;
    }, [isAuthenticated, loading, router]);

    const redirectIfAuthenticated = useCallback((redirectPath = '/v/chat') => {
        if (isAuthenticated && !loading) {
            router.replace(redirectPath);
            return false;
        }
        return true;
    }, [isAuthenticated, loading, router]);
    
    const login = async (credentials: { email: string, password: string }, redirectPath = '/v/chat') => {
        try {
            await store.login(credentials.email, credentials.password);
            if (store.isAuthenticated) {
                router.replace(redirectPath);
                return true;
            }
            return false;
        } catch  {
            return false;
        }
    };

    const register = async (userData: { 
        username: string, 
        email: string, 
        password: string,
        name: string 
    }, redirectPath = '/v/chat') => {
        try {
            await store.register(
                userData.username, 
                userData.email, 
                userData.password, 
                userData.name
            );
            if (store.isAuthenticated) {
                router.replace(redirectPath);
                return true;
            }
            return false;
        } catch  {
            return false;
        }
    };

    const logout = async (redirectPath = '/auth') => {
        await store.logout();
        router.replace(redirectPath);
    };

    return {
        // Auth state
        user,
        isAuthenticated,
        loading,
        error,
        
        // Auth operations with navigation
        login,
        register,
        logout,
        clearError: store.clearError,
        
        // Direct user update without API calls
        updateUserInStore: store.updateUserInStore,
        
        // Protection helpers
        requireAuth,
        redirectIfAuthenticated,

        // Additional operations
        verifyUser: store.verifyUser,
    };
};

export default useAuth;