import { Server as SocketServer } from 'socket.io';
import http from 'http';
import { socketAuthMiddleware } from './middleware';
import { registerSocketHandlers } from './handler';

export const initSocketServer = (server: http.Server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST', 'PUT'],
      credentials: true
    }
  });

  io.use(socketAuthMiddleware);
  registerSocketHandlers(io);
  return io;
};