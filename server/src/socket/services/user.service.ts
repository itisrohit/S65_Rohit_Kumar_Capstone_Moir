import { User, UserStatus } from '../../models/user.model';
import { broadcastUserStatus } from '../service';
// Update user online status
export const updateUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    const status = isOnline ? UserStatus.ONLINE : UserStatus.OFFLINE;
    
    await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    );
    
    // Broadcast the status change
    broadcastUserStatus(userId, isOnline);
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};
