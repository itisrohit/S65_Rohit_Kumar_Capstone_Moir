import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { ExtendedError } from 'socket.io/dist/namespace';

export interface AuthenticatedSocket extends Socket {
  user?: any;
}

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError | undefined) => void
) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token is required'));
    }
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
    const user = await User.findById((decoded as any)._id).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};