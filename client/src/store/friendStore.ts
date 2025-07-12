import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${API_URL}/friend`,
  withCredentials: true,
});

// Types
export interface Friend {
  id: string;
  userId: string;
  name: string;
  username: string;
  image: string;
  status: string;
  friendshipDate: string;
}

export interface FriendRequest {
  id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    image: string;
    status: string;
  };
  createdAt: string;
  isRead: boolean;
}

export interface FriendAcceptance {
  id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    image: string;
    status: string;
  };
  acceptedAt: string;
}

export interface UnreadCounts {
  total: number;
  incoming: number;
  acceptances: number;
}

interface SendRequestResponse {
  statusCode: number;
  data: {
    success: boolean;
    data: {
      friendship: {
        _id: string;
        requester: string;
        recipient: string;
        status: string;
        requestRead: boolean;
        acceptanceRead: boolean;
      }
    };
  };
  message: string;
  success: boolean;
}

interface GetFriendsResponse {
  statusCode: number;
  data: {
    friends: Friend[];
  };
  message: string;
  success: boolean;
}

interface GetFriendRequestsResponse {
  statusCode: number;
  data: {  // This is the actual data object directly
    incoming?: FriendRequest[];
    outgoing?: FriendRequest[];
    acceptances?: FriendAcceptance[];
    unreadCounts?: UnreadCounts;  // Make optional for safety
  };
  message: string;
  success: boolean;
}

interface FriendStore {
  // State
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  acceptances: FriendAcceptance[];
  unreadCounts: UnreadCounts;
  loading: boolean;
  error: string | null;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchFriendRequests: (direction?: 'all' | 'incoming' | 'outgoing') => Promise<void>;
  sendFriendRequest: (emailOrUsername: string) => Promise<void>;
  respondToFriendRequest: (friendshipId: string, accept: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
  updateFriendInfo: (user: { _id: string, name: string, username: string, image: string, status: string }) => void;
  
  // Socket event handlers
  addFriendRequest: (request: FriendRequest) => void;
  updateFriendRequestStatus: (friendshipId: string, accepted: boolean) => void;
  markRequestAsSeen: (friendshipId: string) => void;
  clearAllNotifications: () => void;
  updateFriendStatus: (userId: string, isOnline: boolean) => void;
}

export const useFriendStore = create<FriendStore>()((set, get) => ({
  // Initial state
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  acceptances: [],
  unreadCounts: {
    total: 0,
    incoming: 0,
    acceptances: 0,
  },
  loading: false,
  error: null,

  // Fetch friends list
  fetchFriends: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get<GetFriendsResponse>('/list');
      
      // Add logging
      console.log('Friends list response:', response.data);
      
      if (response.data.success) {
        // Fix: Use safer data access
        const friends = response.data.data?.friends || [];
        
        set({
          friends,
          loading: false
        });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch friends';
      set({ error: errorMessage, loading: false });
    }
  },

  // Fetch friend requests and acceptances
  fetchFriendRequests: async (direction = 'all') => {
    try {
      set({ loading: true, error: null });
      const response = await api.get<GetFriendRequestsResponse>(`/requests?direction=${direction}`);
      
      // Add logging to debug the response structure
      console.log('Friend requests response:', response.data);
      
      if (response.data.success) {
        // Fix: The response data structure is likely one level shallower than expected
        const responseData = response.data.data || {};
        
        set({
          incomingRequests: responseData.incoming || [],
          outgoingRequests: responseData.outgoing || [],
          acceptances: responseData.acceptances || [],
          // Add fallback to prevent undefined errors
          unreadCounts: responseData.unreadCounts || { 
            total: 0, 
            incoming: 0, 
            acceptances: 0 
          },
          loading: false
        });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch friend requests';
      set({ error: errorMessage, loading: false });
    }
  },

  // Send a friend request
  sendFriendRequest: async (emailOrUsername: string) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post<SendRequestResponse>('/send', {
        emailorusername: emailOrUsername
      });
      
      if (response.data.success) {
        // Refresh outgoing requests
        await get().fetchFriendRequests('outgoing');
        set({ loading: false });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? 
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message : 
        'Failed to send friend request';
      set({ error: errorMessage, loading: false });
    }
  },

  // Respond to friend request (accept or reject)
  respondToFriendRequest: async (friendshipId: string, accept: boolean) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post(`/${friendshipId}/respond/`, {
        accept
      });
      
      if (response.data.success) {
        // Remove the request from incoming requests
        set(state => ({
          incomingRequests: state.incomingRequests.filter(req => req.id !== friendshipId),
          unreadCounts: {
            ...state.unreadCounts,
            incoming: Math.max(0, state.unreadCounts.incoming - 1),
            total: Math.max(0, state.unreadCounts.total - 1)
          },
          loading: false
        }));
        
        // If accepted, refresh friends list
        if (accept) {
          get().fetchFriends();
        }
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to respond to friend request';
      set({ error: errorMessage, loading: false });
    }
  },

  // Mark all friend requests and acceptances as read
  markAllAsRead: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/mark-all-read');
      
      if (response.data.success) {
        // Update read status locally
        set(state => ({
          incomingRequests: state.incomingRequests.map(req => ({
            ...req,
            isRead: true
          })),
          acceptances: [], // Clear acceptances as they're now read
          unreadCounts: {
            total: 0,
            incoming: 0,
            acceptances: 0
          },
          loading: false
        }));
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notifications as read';
      set({ error: errorMessage, loading: false });
    }
  },

  // Clear any errors
  clearError: () => {
    set({ error: null });
  },

  // Update friend info in the store
  updateFriendInfo: (user: { _id: string, name: string, username: string, image: string, status: string }) => {
    set(state => {
      // Update in friends list
      const updatedFriends = state.friends.map(friend => {
        if (friend.userId === user._id) { 
          return {
            ...friend,
            name: user.name,         
            username: user.username,  
            image: user.image,
            status: user.status
          };
        }
        return friend;
      });
      
      // Update in incoming requests (this part is correct)
      const updatedIncoming = state.incomingRequests.map(request => {
        if (request.user._id === user._id) {
          return {
            ...request,
            user: {
              ...request.user,
              name: user.name,
              username: user.username,
              image: user.image,
              status: user.status
            }
          };
        }
        return request;
      });
      
      // Update in outgoing requests (this part is correct)
      const updatedOutgoing = state.outgoingRequests.map(request => {
        if (request.user._id === user._id) {
          return {
            ...request,
            user: {
              ...request.user,
              name: user.name,
              username: user.username,
              image: user.image,
              status: user.status
            }
          };
        }
        return request;
      });
      
      return { 
        friends: updatedFriends,
        incomingRequests: updatedIncoming,
        outgoingRequests: updatedOutgoing
      };
    });
    console.log('Friend info updated in friend store:', user._id);
  },
  
  // Socket event handlers
  addFriendRequest: (request: FriendRequest) => {
    set(state => {
      // Check if this request already exists
      const exists = state.incomingRequests.some(req => req.id === request.id);
      
      if (exists) return state;
      
      return {
        incomingRequests: [request, ...state.incomingRequests],
        unreadCounts: {
          ...state.unreadCounts,
          incoming: state.unreadCounts.incoming + 1,
          total: state.unreadCounts.total + 1
        }
      };
    });
  },

  updateFriendRequestStatus: (friendshipId: string, accepted: boolean) => {
    set(state => {
      // Find the request in outgoing requests first
      const request = state.outgoingRequests.find(req => req.id === friendshipId);
      
      if (!request) {
        console.warn(`Request ${friendshipId} not found in outgoing requests`);
        return state; // Return unmodified state if we can't find the request
      }
      
      // Remove from outgoing requests
      const newOutgoingRequests = state.outgoingRequests.filter(
        req => req.id !== friendshipId
      );
      
      // If accepted, add to acceptances
      if (accepted) {
        const newAcceptance: FriendAcceptance = {
          id: request.id,
          user: request.user,
          acceptedAt: new Date().toISOString()
        };
        
        return {
          outgoingRequests: newOutgoingRequests,
          acceptances: [newAcceptance, ...state.acceptances],
          unreadCounts: {
            ...state.unreadCounts,
            acceptances: state.unreadCounts.acceptances + 1,
            total: state.unreadCounts.total + 1
          }
        };
      }
      
      // If rejected, just remove from outgoing
      return { 
        outgoingRequests: newOutgoingRequests 
      };
    });
  },

  markRequestAsSeen: (friendshipId: string) => {
    set(state => ({
      incomingRequests: state.incomingRequests.map(req => 
        req.id === friendshipId ? { ...req, isRead: true } : req
      ),
      unreadCounts: {
        ...state.unreadCounts,
        incoming: Math.max(0, state.unreadCounts.incoming - 1),
        total: Math.max(0, state.unreadCounts.total - 1)
      }
    }));
  },

  clearAllNotifications: () => {
    set(state => ({
      incomingRequests: state.incomingRequests.map(req => ({ ...req, isRead: true })),
      acceptances: [],
      unreadCounts: {
        total: 0,
        incoming: 0,
        acceptances: 0
      }
    }));
  },

  updateFriendStatus: (userId: string, isOnline: boolean) => {
    set(state => ({
      friends: state.friends.map(friend => 
        friend.userId === userId ? { ...friend, status: isOnline ? 'online' : 'offline' } : friend
      )
    }));
  }
}));

export default useFriendStore;