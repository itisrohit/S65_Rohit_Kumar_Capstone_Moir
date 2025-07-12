import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../utils/types/auth.types';

export const verifyJWT = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies?.refreshToken || 
                        req.body?.refreshToken || 
                        req.header('Authorization')?.replace('Bearer ', '');

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    );
    const user = await User.findById((decoded as any)._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token or user doesn\'t exist');
    }

    (req as AuthRequest).user = user;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }
    next(error);
  }
};