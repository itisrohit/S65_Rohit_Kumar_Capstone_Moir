import { Request, Response } from "express";
import { User, UserStatus } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthRequest } from "../utils/types/auth.types";
import { deleteImage } from '../middlewares/cloudinary.middleware';
import { broadcastToAll } from '../socket/service';
import { SOCKET_EVENTS } from '../socket/events';

const generateAccessAndRefreshTokens = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  return { accessToken, refreshToken };
};

//  Register a new user
export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, email, password, name } = req.body;
    if (!username || !email || !password || !name) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ApiError(409, "User with email or username already exists");
    }
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      status: "online",
    });
    const createdUser = await User.findById(user._id).select("-password");
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      createdUser._id as string
    );
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      // .cookie("accessToken", accessToken, {
      //   httpOnly: false,
      //   secure: false,
      //   sameSite: "none",
      //   maxAge: 15 * 60 * 1000,
      // })
      .status(201)
      .json(
        new ApiResponse(
          201,
          {
            sucess: true,
            user: {},
            accessToken,
          },
          "User registered successfully"
        )
      );
  }
);

//  Login a user
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id as string
  );
  user.status = UserStatus.ONLINE;
  await user.save({ validateBeforeSave: false });

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    // .cookie("accessToken", accessToken, {
    //   httpOnly: false,
    //   secure: false,
    //   sameSite: "none",
    //   maxAge: 15 * 60 * 1000,
    // })
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          sucess: true,
          user: {},
          accessToken,
        },
        "User logged in successfully"
      )
    );
});

//  Logout a user
export const logoutUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }
    await User.findByIdAndUpdate(
      userId,
      {
        status: UserStatus.OFFLINE
      },
      { new: true }
    );
    res
      .clearCookie("accessToken", {
        httpOnly: false,
        secure: false,
        sameSite: "none"
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      })
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "User logged out successfully"
      ));
  }
);

// Get user profile
export const getUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }
    const user = await User.findById(userId).select("-password");

    res.status(200).json(
      new ApiResponse(
        200,
        {
          sucess: true,
          user,
        },
        "User profile fetched successfully"
      )
    );
  }
);

export const refreshAccessToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized access");
      };
      const user = await User.findById(userId).select("-password"); 
      if (!user) {
        throw new ApiError(404, "Invalid refresh token");
      }

      const accessToken = user.generateAccessToken();

      res.status(200).json(
        new ApiResponse(
          200,
          {
            success: true,
            accessToken
          },
          "Access token refreshed successfully"
        )
      );
   
  }
);

// Get all users
export const getAllUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized access");
    }
    
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments();
    
    res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
          users,
          pagination: {
            total: totalUsers,
          }
        },
        "Users fetched successfully"
      )
    );
  }
);

// Update user information (now with image upload and real-time updates)
export const updateUserInfo = asyncHandler(
  async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }

    const { name, username, email } = req.body;
    
    // Check for required fields - either form fields or file
    if (!name && !username && !email && !req.file) {
      throw new ApiError(400, "At least one field is required to update");
    }
    
    // If username or email is being updated, check for duplicates
    if (username || email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } }, // Not the current user
          { $or: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : [])
          ]}
        ]
      });
      
      if (existingUser) {
        throw new ApiError(409, "Username or email already in use");
      }
    }
    
    // Find the user to check for existing image
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }
    
    // Handle image deletion if uploading a new one
    let oldImagePublicId = null;
    if (req.file && existingUser.image && existingUser.image.includes('cloudinary')) {
      try {
        // Extract public ID from URL pattern: /profile_images/filename
        const urlParts = existingUser.image.split('/');
        const folderIndex = urlParts.findIndex(part => part === 'profile_images');
        
        if (folderIndex >= 0 && folderIndex < urlParts.length - 1) {
          // Get filename without extension
          const filename = urlParts[folderIndex + 1].split('.')[0];
          oldImagePublicId = `profile_images/${filename}`;
        }
      } catch (err) {
        console.error("Error extracting public ID:", err);
        // Continue anyway - just won't delete old image
      }
    }
    
    // Create update object with only provided fields
    const updateData: { [key: string]: any } = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username.toLowerCase();
    if (email) updateData.email = email.toLowerCase();
    if (req.file) updateData.image = req.file.path; // Use path from Cloudinary upload
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password");
    
    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }
    
    // Delete old image if needed
    if (oldImagePublicId) {
      deleteImage(oldImagePublicId).catch(err => {
        console.error("Error deleting old image:", err);
      });
    }
    
    // Broadcast user update to all connected clients
    try {
      // Send only necessary user data
      const userData = {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        image: updatedUser.image,
        status: updatedUser.status
      };
      
      console.log("Broadcasting user update:", userData);
      broadcastToAll(userId.toString(), SOCKET_EVENTS.USER_UPDATED, { user: userData });
    } catch (socketError) {
      console.error("Error broadcasting user update:", socketError);
      // Continue with response even if socket broadcast fails
    }
    
    res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
          user: updatedUser
        },
        "User information updated successfully"
      )
    );
  }
);

// Update user password
export const updateUserPassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current password and new password are required");
    }
    
    if (currentPassword === newPassword) {
      throw new ApiError(400, "New password must be different from current password");
    }
    
    // Password complexity validation
    if (newPassword.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long");
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    // Verify current password
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Current password is incorrect");
    }
    
    // Update password
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save hook to hash the password
    
    // Generate new tokens for security
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userId);
    
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            success: true,
            accessToken
          },
          "Password updated successfully"
        )
      );
  }
);


