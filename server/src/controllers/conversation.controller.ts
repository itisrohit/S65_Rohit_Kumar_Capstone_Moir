import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Message } from "../models/message.model";
import { Conversation } from "../models/conversation.model";
import { Friend, FriendshipStatus } from "../models/friend.model";
import { AuthRequest } from "../utils/types/auth.types";
import {
  PopulatedUser,
  PopulatedMessage,
  ConversationDocument,
  MessageDocument,
} from "../utils/types/conversation.type";
import { UserStatus } from "../models/user.model";
import { User } from "../models/user.model";
import { SOCKET_EVENTS } from "../socket/events";
import { notifyUser, notifyConversationParticipants } from "../socket/service";

// Get chat list (conversations + friends without conversations)
export const getChatList = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // 1. Get existing conversations - already sorted by updatedAt for recency
    const existingConversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate<{ participants: PopulatedUser[] }>({
        path: "participants",
        select: "name username status image",
      })
      .populate<{ lastMessage: PopulatedMessage }>({
        path: "lastMessage",
        select: "text sender createdAt",
      })
      .sort({ updatedAt: -1 });

    // 2. Get all accepted friends - sort by most recently accepted
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: FriendshipStatus.ACCEPTED },
        { recipient: userId, status: FriendshipStatus.ACCEPTED },
      ],
    })
      .populate<{ requester: PopulatedUser }>({
        path: "requester",
        select: "name username status image",
      })
      .populate<{ recipient: PopulatedUser }>({
        path: "recipient",
        select: "name username status image",
      })
      .sort({ updatedAt: -1 }); // Sort by when the friendship was last updated

    // 3. Format conversations for response
    const formattedConversations = existingConversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      const chatName = otherUser?.name || "Unknown";
      const chatAvatar = otherUser?.image || "";
      const online = otherUser?.status === UserStatus.ONLINE;
      const otherUserId = otherUser?._id;

      const unread = conv.unreadCount.get(userId.toString()) || 0;

      return {
        id: conv._id,
        name: chatName,
        avatar: chatAvatar,
        lastMessage: conv.lastMessage ? conv.lastMessage.text : "",
        timestamp: conv.lastMessage
          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date(conv.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        online,
        unread,
        otherUserId,
        updatedAt: conv.updatedAt,
        type: "conversation",
        aiEnabled: conv.aiEnabled, // Add this line
      };
    });

    // 4. Find friends who don't have conversations yet
    const friendsWithoutConversations = [];

    for (const friendship of friendships) {
      const friend =
        friendship.requester._id.toString() === userId.toString()
          ? friendship.recipient
          : friendship.requester;

      // Check if there's already a conversation with this friend
      const hasConversation = existingConversations.some((conv) =>
        conv.participants.some(
          (p) => p._id.toString() === friend._id.toString()
        )
      );

      // If no conversation exists, add to available friends list
      if (!hasConversation) {
        friendsWithoutConversations.push({
          id: `f-${friend._id}`,
          name: friend.name,
          avatar: friend.image,
          lastMessage: "Send a message to start chatting",
          timestamp: new Date(friendship.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          online: friend.status === "online",
          unread: 0,
          otherUserId: friend._id,
          updatedAt: friendship.updatedAt, // Include friendship update time for sorting
          type: "friend",
        });
      }
    }

    // 5. Combine both lists and sort by recent activity
    const chatList = [
      ...formattedConversations,
      ...friendsWithoutConversations,
    ].sort((a, b) => {
      // Put pinned chats first (if I implement pinning feature)
      // if (a.pinned && !b.pinned) return -1;
      // if (!a.pinned && b.pinned) return 1;

      // Then sort by last activity (message or friend request acceptance)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
          data: chatList,
        },
        "Chat list fetched successfully"
      )
    );
  }
);

// Get messages for a specific conversation
export const getMessages = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { conversationId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Check if this is a "f-" prefixed ID (indicating no conversation exists yet)
    if (conversationId.startsWith("f-")) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            success: true,
            data: [], // No messages yet for new conversations
          },
          "No messages in this conversation yet"
        )
      );
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found or access denied");
    }

    // Get messages for this conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate<{ sender: PopulatedUser }>("sender", "name");

    // Format messages for client
    const formattedMessages = messages.map((message) => ({
      id: message._id,
      text: message.text,
      sender:
        message.isAIMessage ? "ai" :
        message.sender._id.toString() === userId.toString() ? "me" : "other",
      time: new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: message.createdAt,
      read: message.read,
    }));

    // Mark messages as read
    if (messages.length > 0) {
      // Update unread counter in the conversation
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();

      // Also mark all messages as read
      await Message.updateMany(
        {
          conversationId,
          sender: { $ne: userId },
          read: false,
        },
        { read: true }
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
          data: formattedMessages,
        },
        "Messages fetched successfully"
      )
    );
  }
);

// Send a new message in a conversation
export const sendMessage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { text } = req.body;
    let { conversationId } = req.params;
    let conversation: ConversationDocument;
    let isNewConversation = false;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    if (!text || !text.trim()) {
      throw new ApiError(400, "Message text is required");
    }

    // Handle creating a new conversation with a friend
    if (conversationId.startsWith("f-")) {
      const friendId = conversationId.replace("f-", "");

      // Verify friendship exists
      const friendship = await Friend.findOne({
        $or: [
          {
            requester: userId,
            recipient: friendId,
            status: FriendshipStatus.ACCEPTED,
          },
          {
            requester: friendId,
            recipient: userId,
            status: FriendshipStatus.ACCEPTED,
          },
        ],
      });

      if (!friendship) {
        throw new ApiError(403, "You must be friends to start a conversation");
      }

      // Create a new conversation
      conversation = (await Conversation.create({
        participants: [userId, friendId],
        unreadCount: new Map([[friendId.toString(), 1]]),
      })) as unknown as ConversationDocument;

      conversationId = conversation._id.toString();
      isNewConversation = true;
    } else {
      // For existing conversations, verify user has access
      conversation = (await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] },
      })) as unknown as ConversationDocument;

      if (!conversation) {
        throw new ApiError(404, "Conversation not found or access denied");
      }
    }

    // Create the message
    const newMessage = (await Message.create({
      conversationId,
      sender: userId,
      text,
      read: false,
    })) as unknown as MessageDocument;

    // Update the conversation with last message
    conversation.lastMessage = newMessage._id;

    // Update unread counters for all participants except sender
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId.toString()) {
        const currentCount =
          conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(
          participantId.toString(),
          currentCount + 1
        );
      }
    });

    await conversation.save();

    // Format the response
    const responseMessage = {
      id: newMessage._id,
      text: newMessage.text,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: newMessage.createdAt,
    };

    // Get details about the conversation for new conversations
    let conversationDetails = null;
    if (isNewConversation) {
      const otherUser = await User.findById(
        conversation.participants.find(
          (p) => p.toString() !== userId.toString()
        )
      ).select("name image status");

      if (otherUser) {
        conversationDetails = {
          id: conversation._id,
          name: otherUser.name,
          avatar: otherUser.image,
          online: otherUser.status === UserStatus.ONLINE,
          unread: 0,
          otherUserId: otherUser._id,
          aiEnabled: conversation.aiEnabled, // Add this line
        };
      }
    }

    // SOCKET NOTIFICATION
    // Notify all participants except the sender
    notifyConversationParticipants(
      conversation.participants,
      userId.toString(),
      SOCKET_EVENTS.MESSAGE_RECEIVE,
      {
        id: newMessage._id,
        text: newMessage.text,
        sender: "other",
        conversationId,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: newMessage.createdAt,
        isNewConversation,
      }
    );
    notifyUser(userId, SOCKET_EVENTS.CHAT_MESSAGE_UPDATE, {
      id: conversationId, 
      lastMessage: newMessage.text,
      timestamp: new Date().toLocaleTimeString(),
      updatedAt: new Date(),
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          success: true,
          data: {
            message: responseMessage,
            conversationId,
            conversation: conversationDetails,
          },
        },
        isNewConversation
          ? "New conversation started"
          : "Message sent successfully"
      )
    );
  }
);

// Mark messages as read in a conversation
export const markMessagesAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { conversationId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    // Find the conversation and verify user has access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found or access denied");
    }

    // Reset unread counter
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        read: false,
      },
      { read: true }
    );

    // SOCKET NOTIFICATION
    // Notify other participants that messages have been read
    notifyConversationParticipants(
      conversation.participants,
      userId.toString(),
      SOCKET_EVENTS.MESSAGE_READ,
      {
        conversationId,
        readBy: userId,
      }
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
        },
        "Messages marked as read"
      )
    );
  }
);

// Toggle AI for a conversation
export const toggleAIForConversation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { conversationId } = req.params;
    const { enabled } = req.body;
    
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    if (typeof enabled !== 'boolean') {
      throw new ApiError(400, "Enabled status must be a boolean");
    }

    // Find the conversation and verify user has access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found or access denied");
    }

    // Update AI status
    conversation.aiEnabled = enabled;
    await conversation.save();

    // Notify all participants about the AI status change
    notifyConversationParticipants(
      conversation.participants,
      userId.toString(),
      SOCKET_EVENTS.AI_TOGGLE,
      {
        conversationId,
        aiEnabled: enabled,
        toggledBy: userId,
      }
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
          aiEnabled: enabled
        },
        `AI ${enabled ? 'enabled' : 'disabled'} for this conversation`
      )
    );
  }
);

// Send an AI message in a conversation
export const sendAIMessage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { text } = req.body;
    const { conversationId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    if (!text || !text.trim()) {
      throw new ApiError(400, "Message text is required");
    }

    // Verify conversation exists and user has access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      throw new ApiError(404, "Conversation not found or access denied");
    }

    // Verify AI is enabled for this conversation
    if (!conversation.aiEnabled) {
      throw new ApiError(400, "AI is not enabled for this conversation");
    }

    // Create special AI message (using the userId as sender for permission checks)
    const newMessage = (await Message.create({
      conversationId,
      sender: userId, // Using user ID as sender but will mark as AI in client
      text,
      read: false,
      isAIMessage: true // Add this field to your Message model
    })) as unknown as MessageDocument;

    // Update the conversation with last message
    conversation.lastMessage = newMessage._id;

    // Update unread counters for all participants except the current user
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== userId.toString()) {
        const currentCount =
          conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(
          participantId.toString(),
          currentCount + 1
        );
      }
    });

    await conversation.save();

    // Format the response
    const responseMessage = {
      id: newMessage._id,
      text: newMessage.text,
      sender: "ai", // Mark as AI for the sender
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: newMessage.createdAt,
    };

    // Notify all participants including the sender
    conversation.participants.forEach((participantId) => {
      const isCurrentUser = participantId.toString() === userId.toString();
      
      // Send to all participants, with appropriate sender field
      notifyUser(participantId.toString(), SOCKET_EVENTS.MESSAGE_RECEIVE, {
        id: newMessage._id,
        text: newMessage.text,
        sender: "ai", // Always AI for all recipients
        conversationId,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: newMessage.createdAt,
      });
      
      // Update chat list for all participants
      notifyUser(participantId.toString(), SOCKET_EVENTS.CHAT_MESSAGE_UPDATE, {
        id: conversationId,
        lastMessage: newMessage.text,
        timestamp: new Date().toLocaleTimeString(),
        updatedAt: new Date(),
      });
    });

    res.status(201).json(
      new ApiResponse(
        201,
        {
          success: true,
          data: {
            message: responseMessage,
            conversationId,
          },
        },
        "AI message sent successfully"
      )
    );
  }
);
