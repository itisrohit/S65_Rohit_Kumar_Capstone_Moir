import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { disconnectSocket } from '@/socket/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  image: string;
}

interface AuthResponse {
  statusCode: number;
  data: {
    success?: boolean;
    user?: User;
    accessToken?: string;
  };
  message: string;
  success: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyUser: () => Promise<void>;
  clearError: () => void;
  localLogout: () => void; 
  refreshToken: () => Promise<boolean>; 
  
  // Adding these new methods
  updateProfile: (userData: Partial<{name: string, username: string, email: string}>, image?: File) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserInStore: (user: User) => void;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Create the store with separate persistence configurations
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      loading: false,
      error: null,
      register: async (username, email, password, name) => {
        try {
          set({ loading: true, error: null });
          const response = await api.post<AuthResponse>('/user/register', {
            username,
            email,
            password,
            name,
          });

          if (response.data.success) {
            set({
              accessToken: response.data.data.accessToken || null,
              isAuthenticated: true,
            });
            // Call verifyUser immediately to get complete user profile
            await get().verifyUser();
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ error: errorMessage, loading: false });
        }
      },

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const response = await api.post<AuthResponse>('/user/login', {
            email,
            password,
          });

          if (response.data.success) {
            set({
              accessToken: response.data.data.accessToken || null,
              isAuthenticated: true,
            });
            // Call verifyUser immediately to get complete user profile
            await get().verifyUser();
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ error: errorMessage, loading: false });
        }
      },

      logout: async () => {
        try {
          set({ loading: true, error: null });
          const response = await api.post<AuthResponse>('/user/logout');
          
          if (response.data.success) {
            // Use the existing localLogout function
            get().localLogout();
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Logout failed';
          set({ error: errorMessage, loading: false });
          
          // Force logout on client side even if API call fails
          console.log('⚠️ Server logout failed, falling back to client-side logout');
          get().localLogout();
        } 
      },

      refreshToken: async () => {
        try {
          console.log('🔄 Refreshing access token');
          const response = await api.get<AuthResponse>('/user/access-token');
          
          if (response.data.success) {
            console.log('✅ Token refresh successful');
            set({
              accessToken: response.data.data.accessToken || null,
            });
            return true;
          } else {
            console.log('❌ Token refresh failed:', response.data.message);
            set({ error: response.data.message });
            return false;
          }
        } catch (error) {
          console.log('❌ Exception in refreshToken:', error);
          const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
          set({ error: errorMessage });
          return false;
        }
      },

      verifyUser: async () => {
        // Remove the early return and token check
        console.log('🔄 Starting user verification');
        try {
          set({ loading: true, error: null });
          
          // Fetch user profile
          const profileResponse = await api.get<AuthResponse>('/user/profile');
          
          if (profileResponse.data.success) {
            // Refresh token in parallel
            const tokenRefreshed = await get().refreshToken();
            
            if (tokenRefreshed) {
              set({
                user: profileResponse.data.data.user || null,
                isAuthenticated: true,
                loading: false,
              });
            } else {
              get().localLogout();
            }
          } else {
            // Handle profile fetch failure
            set({ 
              error: profileResponse.data.message, 
              loading: false,
            });
            get().localLogout();
          }
        } catch (error) {
          // Handle errors
          console.log('❌ Exception in verifyUser:', error);
          get().localLogout();
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Add localLogout as a store method
      localLogout: () => {
        console.log('⚠️ localLogout called');
        
        // 1. Disconnect socket - do this before refresh for clean socket shutdown
        disconnectSocket();
        
        // 2. Clear auth state - important for persistence
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          loading: false,
        });
        
        // 3. Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        
        // 4. Clear localStorage items
        localStorage.removeItem('auth-storage');
        
        // 5. Refresh the page to reset all application state
        if (typeof window !== 'undefined') {
          window.location.href = '/auth'; // Redirect to login page
        }
      },
      
      updateProfile: async (userData, image) => {
        try {
          set({ loading: true, error: null });
          
          // Create FormData for multipart/form-data request
          const formData = new FormData();
          
          // Add text fields if they exist
          if (userData.name) formData.append('name', userData.name);
          if (userData.username) formData.append('username', userData.username);
          if (userData.email) formData.append('email', userData.email);
          
          // Add image if provided
          if (image) formData.append('image', image);
          
          const response = await api.put('/user/update', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (response.data.success) {
            // Update user in state
            set({ 
              user: response.data.data.user,
              loading: false,
            });
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Profile update failed';
          set({ error: errorMessage, loading: false });
        }
      },
      
      updatePassword: async (currentPassword, newPassword) => {
        try {
          set({ loading: true, error: null });
          
          const response = await api.put('/user/update-password', {
            currentPassword,
            newPassword,
          });
          
          if (response.data.success) {
            // Update access token since it was refreshed
            set({
              accessToken: response.data.data.accessToken || null,
              loading: false,
            });
          } else {
            set({ error: response.data.message, loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Password update failed';
          set({ error: errorMessage, loading: false });
        }
      },

      updateUserInStore: (user: User) => {
        set({ user });
        console.log('User profile updated in store via socket:', user);
      },
    }),
    {
      name: 'auth-storage',
      // Only persist the user and authentication status, not the token
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: createJSONStorage(() => {
        // Use a mix: localStorage for user data, memory for tokens
        return {
          getItem: (name) => {
            const value = localStorage.getItem(name);
            if (value) {
              const parsed = JSON.parse(value);
              // Ensure token is never loaded from localStorage
              return JSON.stringify({
                ...parsed,
                state: {
                  ...parsed.state,
                  accessToken: null
                }
              });
            }
            return null;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, value);
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          }
        };
      })
    }
  )
);

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle unauthorized responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && useAuthStore.getState().isAuthenticated) {
      console.log('🚫 401 Unauthorized response detected');
      useAuthStore.getState().localLogout();
    }
    return Promise.reject(error);
  }
);

export default useAuthStore;