import { Request, Response } from "express";
import { createMusicHistory, getMusicHistoryByUser } from "../models/musichistory.model";
import { searchYouTube, getStreamInfo } from "../services/youtube.service";
import { AuthRequest } from "../utils/types/auth.types";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

// Search for music tracks
export const searchMusic = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;
  
  if (!query || typeof query !== "string") {
    throw new ApiError(400, "Valid search query required");
  }
  
  const results = await searchYouTube(query);
  return res.status(200).json(
    new ApiResponse(200, results, "Search results fetched successfully")
  );
});

// Stream music - now much simpler!
export const streamMusic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  try {
    // Get both track info AND stream URL in one call
    const { streamUrl, trackInfo } = await getStreamInfo(id);
    
    // Record music history if user is authenticated
    if (userId) {
      await createMusicHistory({
        userId,
        trackId: id,
        trackTitle: trackInfo.title,
        artist: trackInfo.artist,
        playedAt: new Date()
      });
    }
    
    console.log("Returning YouTube URL for client-side audio streaming");
    
    // Return the YouTube URL as JSON for the client to handle
    return res.status(200).json(
      new ApiResponse(200, {
        streamUrl,
        trackInfo
      }, "Stream URL retrieved successfully")
    );
    
  } catch (error) {
    console.error("Music streaming error:", error);
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to get stream URL")
    );
  }
});

// Get user's music history
export const getMusicHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  
  if (!userId) {
    throw new ApiError(401, "Authentication required");
  }
  
  const history = await getMusicHistoryByUser(userId);
  
  return res.status(200).json(
    new ApiResponse(200, history, "Music history retrieved successfully")
  );
});