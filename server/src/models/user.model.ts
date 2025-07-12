import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name: string;
  image?: string;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
 
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String},
  name: { type: String, required: true },
  image: { type: String },
  status: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
}, { timestamps: true });


UserSchema.pre<IUser>('save', async function(next) {
  if (!this.image) {
    this.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name || this.username)}&background=random&color=fff&size=200`;
  }
  
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  next();
});


UserSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};


UserSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username },
    process.env.ACCESS_TOKEN_SECRET || '' as Secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" } as SignOptions
  );
};

UserSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET || '' as Secret,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" } as SignOptions
  );
};

export const User = mongoose.model<IUser>('User', UserSchema);