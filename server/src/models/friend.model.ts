import mongoose, { Schema, Document } from 'mongoose';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface IFriend extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: FriendshipStatus;
  requestRead: boolean;    
  acceptanceRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FriendSchema: Schema = new Schema({
  requester: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipient: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(FriendshipStatus),
    default: FriendshipStatus.PENDING, 
    required: true 
  },
  requestRead: {
    type: Boolean,
    default: false
  },
  acceptanceRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create a compound index to ensure uniqueness of friendship relationships
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const Friend = mongoose.model<IFriend>('Friend', FriendSchema);