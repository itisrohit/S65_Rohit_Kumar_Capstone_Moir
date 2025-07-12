import { SOCKET_EVENTS } from './events';
import { AuthenticatedSocket } from './middleware';

/**
 * Find a user's socket connection if they're online
 */
export const findUserSocket = (userId: string): AuthenticatedSocket | undefined => {
  // Return early if socket server isn't initialized
  if (!global.socketIo) return undefined;
  
  // Convert sockets collection to array and find the user's socket
  const sockets = Array.from(global.socketIo.sockets.sockets.values());
  
  // Find socket where user ID matches and cast to AuthenticatedSocket
  return sockets.find(socket => 
    (socket as AuthenticatedSocket).user?._id.toString() === userId.toString()
  ) as AuthenticatedSocket | undefined;
};

/**
 * Send a message to a specific user
 * Returns true if message was sent (user is online)
 */
export const notifyUser = (userId: string, event: string, data: any): boolean => {
  const socket = findUserSocket(userId);
  
  // If user is online, send the message
  if (socket) {
    socket.emit(event, data);
    return true;
  }
  
  return false;
};

/**
 * Notify all users in a conversation except the sender
 */
export const notifyConversationParticipants = (
  participants: any[], 
  senderId: string, 
  event: string, 
  data: any
): void => {
  // Loop through each participant
  for (const participantId of participants) {
    // Skip the sender
    if (participantId.toString() === senderId.toString()) continue;
    
    // Send to this participant
    notifyUser(participantId.toString(), event, data);
  }
};

/**
 * Send a message to all connected users except the sender
 */
export const broadcastToAll = (senderId: string, event: string, data: any): void => {
  // Return early if socket server isn't initialized
  if (!global.socketIo) return;
  
  const senderSocket = findUserSocket(senderId);
  
  // If sender is connected, use their socket to broadcast
  if (senderSocket) {
    senderSocket.broadcast.emit(event, data);
  } else {
    // If sender's socket isn't found (likely during disconnect),
    // broadcast from server directly to everyone
    global.socketIo.emit(event, data);
  }
};

/**
 * Let everyone know when a user comes online or goes offline
 */
export const broadcastUserStatus = (userId: string, isOnline: boolean): void => {
  // Choose the appropriate event based on status
  const event = isOnline ? SOCKET_EVENTS.USER_ONLINE : SOCKET_EVENTS.USER_OFFLINE;
  
  // Broadcast the status change to all users
  broadcastToAll(userId, event, { userId });
};