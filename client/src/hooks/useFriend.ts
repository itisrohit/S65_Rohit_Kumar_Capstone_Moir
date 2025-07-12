import { useState, useCallback } from 'react';
import { useFriendStore } from '@/store/friendStore';

// No more global initialization flags here - AppInitializer handles it

export function useFriend() {
  const { 
    friends,
    incomingRequests, 
    outgoingRequests,
    unreadCounts,
    error,
    sendFriendRequest,
    respondToFriendRequest,
    markAllAsRead,
  } = useFriendStore();
  
  // Only keep loading state for UI feedback during actions
  const [loading, setLoading] = useState(false);
  
  // Remove the initialization effect - AppInitializer handles it
  // Remove the periodic refresh effect - AppInitializer handles it
  
  // Keep the action wrappers with loading state
  const handleSendFriendRequest = useCallback(async (emailOrUsername: string) => {
    setLoading(true);
    try {
      await sendFriendRequest(emailOrUsername);
    } finally {
      setLoading(false);
    }
  }, [sendFriendRequest]);
  
  const handleRespondToRequest = useCallback(async (friendshipId: string, accept: boolean) => {
    setLoading(true);
    try {
      await respondToFriendRequest(friendshipId, accept);
    } finally {
      setLoading(false);
    }
  }, [respondToFriendRequest]);
  
  const handleMarkAllAsRead = useCallback(async () => {
    setLoading(true);
    try {
      await markAllAsRead();
    } finally {
      setLoading(false);
    }
  }, [markAllAsRead]);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    unreadCounts,
    sendFriendRequest: handleSendFriendRequest,
    respondToRequest: handleRespondToRequest,
    markAllAsRead: handleMarkAllAsRead
  };
}

export default useFriend;