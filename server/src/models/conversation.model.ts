import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  unreadCount: Map<string, number>;
  aiEnabled: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema: Schema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  aiEnabled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create index on participants for faster queries
conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);