import { SOCKET_EVENTS } from '../events';
import { findUserSocket, notifyUser } from '../service';
import { FriendDocument } from '../../utils/types/friend.types';

// Notify a user about a new friend request
export const notifyFriendRequest = async (recipientId: string, requester: any, friendshipId: string): Promise<void> => {
  console.log(`🚀 Sending friend request notification to ${recipientId}`);
  try {
    notifyUser(recipientId, SOCKET_EVENTS.FRIEND_REQUEST_SENT, {
      from: {
        _id: requester._id,
        name: requester.name,
        username: requester.username,
        image: requester.image
      },
      requestId: friendshipId // Add this line
    });
  } catch (error) {
    console.error('Error notifying friend request:', error);
  }
};

// Notify a user about a friend request response
export const notifyFriendRequestResponse = async (
  requesterId: string,
  friendship: FriendDocument,
  accepted: boolean
): Promise<void> => {
  try {
    notifyUser(requesterId.toString(), SOCKET_EVENTS.FRIEND_REQUEST_RESPONDED, {
      friendshipId: friendship._id,
      accepted,
      responderId: friendship.recipient
    });
  } catch (error) {
    console.error('Error notifying friend request response:', error);
  }
};

// Notify requester that their request has been seen
export const notifyFriendRequestSeen = async (
  requesterId: string,
  friendshipId: string
): Promise<void> => {
  try {
    const requesterSocket = findUserSocket(requesterId);
    if (requesterSocket) {
      requesterSocket.emit(SOCKET_EVENTS.FRIEND_REQUEST_SEEN, {
        friendshipId
      });
    }
  } catch (error) {
    console.error('Error notifying friend request seen:', error);
  }
};

// Notify when notifications are cleared
export const notifyFriendNotificationsCleared = async (
  userId: string,
  counts: { total: number, requestsRead: number, acceptancesRead: number }
): Promise<void> => {
  try {
    // This could be used to update badges or notifications on other devices
    const userSocket = findUserSocket(userId);
    if (userSocket) {
      userSocket.emit(SOCKET_EVENTS.FRIEND_NOTIFICATIONS_CLEARED, {
        userId,
        counts
      });
    }
  } catch (error) {
    console.error('Error notifying notifications cleared:', error);
  }
};