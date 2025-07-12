import mongoose from 'mongoose';
import { FriendshipStatus } from '../../models/friend.model';

// Basic user type for populated fields
export interface PopulatedFriendUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  image: string;
  status: string;
}

// Standard document type
export type FriendDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: FriendshipStatus;
  requestRead: boolean;
  acceptanceRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Populated document type (after using .populate())
export type PopulatedFriendDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  requester: PopulatedFriendUser;
  recipient: PopulatedFriendUser;
  status: FriendshipStatus;
  requestRead: boolean;
  acceptanceRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In src/utils/types/user.types.ts
export type UserDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  email: string;
  image: string;
  status: string;
}