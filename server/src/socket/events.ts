export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_TYPING: 'user:typing',
  USER_UPDATED: 'user:updated',
  
  FRIEND_REQUEST_SENT: 'friend:request:sent',
  FRIEND_REQUEST_RESPONDED: 'friend:request:responded',
  FRIEND_REQUEST_SEEN: 'friend:request:seen',        
  FRIEND_NOTIFICATIONS_CLEARED: 'friend:notifications:cleared', 

  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_READ: 'message:read',
  MESSAGE_READ_ACK: 'message:read:ack', 

  CHAT_MESSAGE_UPDATE: 'chat:message:update',
  
  AI_TOGGLE: 'ai:toggle', 

  ERROR: 'error'
};