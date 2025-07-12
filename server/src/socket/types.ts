import { Server as SocketServer } from 'socket.io';

declare global {
  var socketIo: SocketServer;
}

export {};