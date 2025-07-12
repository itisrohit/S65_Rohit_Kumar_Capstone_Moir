import mongoose from 'mongoose';


export interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  status: string;
  image: string;
}

export interface PopulatedMessage {
  _id: mongoose.Types.ObjectId;
  text: string;
  sender: mongoose.Types.ObjectId;
  createdAt: Date;
}

export type ConversationDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  unreadCount: Map<string, number>;
  aiEnabled: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDocument = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}