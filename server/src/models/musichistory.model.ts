import mongoose from "mongoose";

const musicHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  trackId: {
    type: String,
    required: true
  },
  trackTitle: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    default: "Unknown Artist"
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient querying
musicHistorySchema.index({ userId: 1, playedAt: -1 });

const MusicHistory = mongoose.model("MusicHistory", musicHistorySchema);

// Create a new entry in music history
export async function createMusicHistory(data: {
  userId: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  playedAt: Date;
}) {
  return await MusicHistory.create(data);
}

// Get music history for a user
export async function getMusicHistoryByUser(userId: string, limit = 20) {
  return await MusicHistory.find({ userId })
    .sort({ playedAt: -1 })
    .limit(limit);
}

export default MusicHistory;