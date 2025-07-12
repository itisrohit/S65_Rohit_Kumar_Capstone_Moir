import axios from 'axios';
import { ApiError } from '../utils/ApiError';

// Check that environment variable is set
if (!process.env.YOUTUBE_API_KEY) {
  console.error('ERROR: YouTube API key not found in environment variables');
}

// Define types
interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover?: string;
  thumbnails?: Array<{ url: string }>;
}

interface StreamResult {
  streamUrl: string;
  trackInfo: TrackInfo;
}

// Mock tracks for fallback
const mockTracks = [
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up",
    artist: "Rick Astley",
    duration: "3:33",
    cover: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Queen - Bohemian Rhapsody",
    artist: "Queen Official",
    duration: "5:59",
    cover: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg"
  },
  {
    id: "JGwWNGJdvx8",
    title: "Ed Sheeran - Shape of You",
    artist: "Ed Sheeran",
    duration: "4:23",
    cover: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg"
  }
];

// Convert duration from ISO 8601 format to readable format
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to get track info from YouTube API or mock data
async function getTrackInfo(id: string): Promise<TrackInfo> {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'snippet,contentDetails',
          id: id,
          key: API_KEY
        }
      }
    );
    
    if (response.data.items && response.data.items.length > 0) {
      const videoData = response.data.items[0];
      return {
        id: videoData.id,
        title: videoData.snippet.title,
        artist: videoData.snippet.channelTitle,
        duration: formatDuration(videoData.contentDetails.duration),
        cover: videoData.snippet.thumbnails.high.url,
        thumbnails: [{ url: videoData.snippet.thumbnails.high.url }]
      };
    }
    
    throw new Error("No video data found");
    
  } catch (error) {
    console.error("YouTube API track info error:", error);
    
    // Find in mock data if available
    const mockTrack = mockTracks.find(track => track.id === id);
    if (mockTrack) {
      console.log("Using mock data for track info");
      return {
        id: mockTrack.id,
        title: mockTrack.title,
        artist: mockTrack.artist,
        duration: mockTrack.duration,
        cover: mockTrack.cover,
        thumbnails: [{ url: mockTrack.cover }]
      };
    }
    
    throw new ApiError(404, "Track not found");
  }
}

// Search for tracks using the official API
export async function searchYouTube(query: string): Promise<TrackInfo[]> {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    
    // Search for videos
    const searchResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          maxResults: 10,
          q: `${query} official audio`,
          type: 'video',
          videoCategoryId: '10', // Music category
          key: API_KEY
        }
      }
    );
    
    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      console.log('No search results found, using fallback data');
      return mockTracks.filter(track => 
        track.title.toLowerCase().includes(query.toLowerCase()) || 
        track.artist.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Get video IDs for content details (duration)
    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');
    
    // Get additional details including duration
    const detailsResponse = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'contentDetails,snippet',
          id: videoIds,
          key: API_KEY
        }
      }
    );
    
    // Map the response to our format
    return detailsResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      duration: formatDuration(item.contentDetails.duration),
      cover: item.snippet.thumbnails.high.url
    }));
    
  } catch (error) {
    console.error("YouTube API search error:", error);
    console.log("Using mock data as fallback");
    
    // Filter mock data based on query for more realistic results
    return mockTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) || 
      track.artist.toLowerCase().includes(query.toLowerCase())
    ) || mockTracks;
  }
}

// Combined function: get track info AND stream URL
export async function getStreamInfo(id: string): Promise<StreamResult> {
  console.log(`Getting stream info for track ID: ${id}`);
  
  // Get track info (reuses the logic from both functions)
  const trackInfo = await getTrackInfo(id);
  
  // Create stream URL
  const streamUrl = `https://www.youtube.com/watch?v=${id}`;
  
  console.log(`Returning YouTube URL for audio streaming: ${streamUrl}`);
  
  return {
    streamUrl,
    trackInfo
  };
}

// Keep these for backward compatibility, but they now just call the helper
export async function getYouTubeTrackById(id: string): Promise<TrackInfo> {
  return getTrackInfo(id);
}

export async function streamYouTubeAudio(id: string) {
  const streamUrl = `https://www.youtube.com/watch?v=${id}`;
  return {
    stream: streamUrl,
    isDirectUrl: true
  };
}