import { Response } from 'express';
import { Friend, FriendshipStatus, } from '../models/friend.model';
import { User } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../utils/types/auth.types';
import { FriendDocument, PopulatedFriendDocument, UserDocument } from '../utils/types/friend.types';
import { 
  notifyFriendRequest, 
  notifyFriendRequestResponse,
  notifyFriendRequestSeen,
  notifyFriendNotificationsCleared
} from '../socket/services/friend.service';

// Send a friend request
export const sendFriendRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { emailorusername } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    if (!emailorusername || typeof emailorusername !== 'string') {
      throw new ApiError(400, "Username or email  is required");
    }

    // Determine if emailorusername is email or username
    const isEmail = emailorusername.includes('@');
    
    // Find recipient by username or email
    const query = isEmail ? { email: emailorusername } : { username: emailorusername };
    const recipientUser = await User.findOne(query) as UserDocument | null;
    
    if (!recipientUser) {
      throw new ApiError(404, "User not found");
    }

    const recipientId = recipientUser._id;

    // Check if trying to add self as friend
    if (userId.toString() === recipientId.toString()) {
      throw new ApiError(400, "Cannot send friend request to yourself");
    }

    // Check if friendship already exists in either direction
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: recipientId },
        { requester: recipientId, recipient: userId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        // If recipient already sent request to current user, accept it automatically
        if (existingFriendship.recipient.toString() === userId.toString()) {
          existingFriendship.status = FriendshipStatus.ACCEPTED;
          existingFriendship.acceptanceRead = false; // Notify original requester
          await existingFriendship.save();
          
          return res.status(200).json(
            new ApiResponse(
              200,
              { friendship: existingFriendship },
              "Friend request accepted"
            )
          );
        }
        throw new ApiError(400, "Friend request already pending");
      }
      
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new ApiError(400, "Already friends with this user");
      }
      
      if (existingFriendship.status === FriendshipStatus.REJECTED) {
        // If previously rejected, update to pending
        existingFriendship.status = FriendshipStatus.PENDING;
        existingFriendship.requestRead = false;
        await existingFriendship.save();
        
        return res.status(200).json(
          new ApiResponse(
            200,
            { friendship: existingFriendship },
            "Friend request sent"
          )
        );
      }
    }

    // Create new friend request
    const newFriendship = await Friend.create({
      requester: userId,
      recipient: recipientId,
      status: FriendshipStatus.PENDING,
      requestRead: false
    }) as unknown as FriendDocument;

    // Send socket notification
    await notifyFriendRequest(recipientId.toString(), req.user, newFriendship._id.toString());

    res.status(201).json(
      new ApiResponse(
        201,
        { friendship: newFriendship },
        "Friend request sent"
      )
    );
  }
);

// Accept or reject a friend request
export const respondToFriendRequest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { friendshipId } = req.params;
    const { accept } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Find the friendship and ensure user is recipient
    const friendship = await Friend.findOne({
      _id: friendshipId,
      recipient: userId,
      status: FriendshipStatus.PENDING
    }) as unknown as FriendDocument;

    if (!friendship) {
      throw new ApiError(404, "Friend request not found or already processed");
    }

    // If request wasn't read before, notify requester that it's been seen now
    if (!friendship.requestRead) {
      await notifyFriendRequestSeen(
        friendship.requester.toString(),
        friendshipId
      );
    }

    // Mark request as read
    friendship.requestRead = true;
    
    // Update status based on response
    if (accept === true) {
      friendship.status = FriendshipStatus.ACCEPTED;
      friendship.acceptanceRead = false; // Requester needs to be notified
    } else {
      friendship.status = FriendshipStatus.REJECTED;
    }

    await friendship.save();

    // Send socket notification to the requester
    await notifyFriendRequestResponse(
      friendship.requester.toString(),
      friendship,
      accept === true
    );

    res.status(200).json(
      new ApiResponse(
        200,
        { friendship },
        accept ? "Friend request accepted" : "Friend request rejected"
      )
    );
  }
);

// Get all friends
export const getFriends = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Find all accepted friendships where user is either requester or recipient
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: FriendshipStatus.ACCEPTED },
        { recipient: userId, status: FriendshipStatus.ACCEPTED }
      ]
    })
    .populate('requester', 'name username image status')
    .populate('recipient', 'name username image status')
    .sort({ updatedAt: -1 }) as unknown as PopulatedFriendDocument[];

    // Format friends list
    const friends = friendships.map(friendship => {
      // Determine which user is the friend (not the current user)
      const isFriendRequester = friendship.recipient._id.toString() === userId.toString();
      const friend = isFriendRequester ? friendship.requester : friendship.recipient;
      
      return {
        id: friendship._id,
        userId: friend._id,
        name: friend.name,
        username: friend.username,
        image: friend.image,
        status: friend.status,
        friendshipDate: friendship.updatedAt
      };
    });

    res.status(200).json(
      new ApiResponse(
        200,
        { friends },
        "Friends fetched successfully"
      )
    );
  }
);

// Get friend requests with unread counts and acceptances - replaces both getFriendRequests and getNotifications
export const getFriendRequests = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { direction = 'all' } = req.query; // 'incoming', 'outgoing', 'all'

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Structure for the response
    const result: {
      incoming?: any[];
      outgoing?: any[];
      acceptances?: any[];
      unreadCounts: {
        total: number;
        incoming: number;
        acceptances: number;
      }
    } = {
      unreadCounts: {
        total: 0,
        incoming: 0,
        acceptances: 0
      }
    };

    // Get incoming requests if needed
    if (direction === 'incoming' || direction === 'all') {
      const incomingRequests = await Friend.find({
        recipient: userId,
        status: FriendshipStatus.PENDING
      })
      .populate('requester', 'name username image status')
      .sort({ createdAt: -1 }) as unknown as PopulatedFriendDocument[];

      result.incoming = incomingRequests.map(request => ({
        id: request._id,
        user: request.requester,
        createdAt: request.createdAt,
        isRead: request.requestRead
      }));
      
      // Count unread incoming requests
      result.unreadCounts.incoming = incomingRequests.filter(req => !req.requestRead).length;
    }

    // Get outgoing requests if needed
    if (direction === 'outgoing' || direction === 'all') {
      const outgoingRequests = await Friend.find({
        requester: userId,
        status: FriendshipStatus.PENDING
      })
      .populate('recipient', 'name username image status')
      .sort({ createdAt: -1 }) as unknown as PopulatedFriendDocument[];

      result.outgoing = outgoingRequests.map(request => ({
        id: request._id,
        user: request.recipient,
        createdAt: request.createdAt
      }));
    }

    // Get acceptances (friend requests that were accepted but not yet seen)
    const acceptances = await Friend.find({
      requester: userId,
      status: FriendshipStatus.ACCEPTED,
      acceptanceRead: false
    })
    .populate('recipient', 'name username image status')
    .sort({ updatedAt: -1 }) as unknown as PopulatedFriendDocument[];

    result.acceptances = acceptances.map(acceptance => ({
      id: acceptance._id,
      user: acceptance.recipient,
      acceptedAt: acceptance.updatedAt
    }));
    
    // Count unread acceptances
    result.unreadCounts.acceptances = acceptances.length;
    
    // Calculate total unread
    result.unreadCounts.total = result.unreadCounts.incoming + result.unreadCounts.acceptances;

    res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Friend requests and notifications fetched successfully"
      )
    );
  }
);

// Mark all friend requests and acceptances as read
export const markAllAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Mark all incoming friend requests as read
    const incomingResult = await Friend.updateMany(
      {
        recipient: userId,
        status: FriendshipStatus.PENDING,
        requestRead: false
      },
      { requestRead: true }
    );

    // Mark all acceptances as read
    const acceptancesResult = await Friend.updateMany(
      {
        requester: userId,
        status: FriendshipStatus.ACCEPTED,
        acceptanceRead: false
      },
      { acceptanceRead: true }
    );

    const totalUpdated = incomingResult.modifiedCount + acceptancesResult.modifiedCount;
    
    // Get the incoming requests that were marked as read to send notifications
    if (incomingResult.modifiedCount > 0) {
      const friendships = await Friend.find({
        recipient: userId,
        status: FriendshipStatus.PENDING,
        requestRead: true
      }).lean(); // Using lean() for better performance
      
      // Notify each requester that their request has been seen
      for (const friendship of friendships) {
        await notifyFriendRequestSeen(
          friendship.requester.toString(),
          friendship._id.toString() // Cast to string to solve type issue
        );
      }
    }
    
    // Send notification that all were marked as read (useful for multi-device sync)
    await notifyFriendNotificationsCleared(
      userId.toString(), 
      { 
        total: totalUpdated,
        requestsRead: incomingResult.modifiedCount,
        acceptancesRead: acceptancesResult.modifiedCount
      }
    );

    res.status(200).json(
      new ApiResponse(
        200,
        { 
          updated: totalUpdated,
          requestsRead: incomingResult.modifiedCount,
          acceptancesRead: acceptancesResult.modifiedCount
        },
        "All notifications marked as read"
      )
    );
  }
);