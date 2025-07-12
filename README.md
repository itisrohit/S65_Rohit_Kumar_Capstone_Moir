# MOIR

## 💡 Project Idea
**MOIR** is an AI-powered chat application that enhances conversations through intelligent assistance. The platform features **Mizuki**, a friendly AI assistant that helps keep conversations flowing naturally. Mizuki can provide conversation starters, ice breakers, message suggestions, and respond to direct questions to make chatting more engaging and meaningful.

### 🤖 Meet Mizuki - Your AI Chat Companion
Mizuki is designed to be warm, helpful, and perceptive - never dominating conversations but always ready to assist when needed. Whether you're stuck for words, want to break the ice, or need a conversation starter, Mizuki is there to help make your chats more enjoyable.

### 🎯 Core Purpose
- **Enhanced Conversations:** AI-powered assistance to keep chats engaging
- **Smart Suggestions:** Context-aware message recommendations
- **Conversation Starters:** Help break the ice and start meaningful discussions
- **Direct AI Interaction:** Ask Mizuki questions directly with @Mizuki commands
- **Real-time Chat:** Seamless messaging with friends with typing indicators and read receipts
- **Friend Management:** Add and manage friends with real-time status updates

## 🛠 Tech Stack
- **🖥 Frontend:** Next.js (TypeScript, Tailwind CSS)
- **🔙 Backend:** Express.js with TypeScript
- **🗄 Database:** MongoDB
- **📡 Real-time Communication:** WebSockets, Socket.io
- **🔑 Authentication:** JWT with refresh tokens
- **☁️ File Storage:** Cloudinary for profile images
- **🤖 AI Integration:** Groq API with Llama 3 model

## ✅ Development Progress (6 Weeks)

### Week 1: Project Setup & Foundation
**Goals:** Establish project structure and basic setup
- **Frontend Setup:** Next.js with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend Setup:** Express.js with TypeScript, MongoDB connection
- **Project Structure:** Organized folder structure for scalability
- **Basic Routing:** Authentication pages and main app layout
- **Environment Configuration:** Development and production environment setup

### Week 2: Authentication System
**Goals:** Complete user authentication and profile management
- **User Registration & Login:** JWT-based authentication with refresh tokens
- **Password Security:** bcrypt hashing and secure password management
- **Session Management:** Persistent sessions with secure cookie handling
- **Profile Management:** User profile CRUD operations
- **Image Upload:** Cloudinary integration for profile pictures
- **Form Validation:** Client and server-side validation

### Week 3: Real-time Chat Foundation
**Goals:** Build the core chat infrastructure
- **WebSocket Setup:** Socket.io integration for real-time communication
- **Database Models:** MongoDB schemas for conversations and messages
- **Message Persistence:** Store and retrieve chat messages
- **Basic Chat UI:** Message display and input components
- **Conversation Management:** Create and manage chat conversations
- **API Endpoints:** RESTful APIs for chat operations

### Week 4: Advanced Chat Features
**Goals:** Enhance chat with real-time features
- **Typing Indicators:** Real-time typing status updates
- **Read Receipts:** Message read status tracking and display
- **Message History:** Complete conversation history with pagination
- **Real-time Updates:** Instant message delivery and status updates
- **Chat List Management:** Organize and display conversations
- **Message Formatting:** Time stamps and sender identification

### Week 5: Friend System & AI Integration
**Goals:** Add social features and AI assistant
- **Friend System:** Send, accept, and reject friend requests
- **Friend Management:** Complete friends list with online status
- **Real-time Notifications:** Socket-based friend request notifications
- **AI Assistant (Mizuki):** Groq API integration with Llama 3 model
- **Smart Responses:** Context-aware conversation assistance
- **Message Suggestions:** AI-powered message recommendations
- **Direct AI Interaction:** @Mizuki command for direct questions

### Week 6: Polish & Optimization
**Goals:** Final touches and performance optimization
- **UI/UX Refinement:** Responsive design and mobile optimization
- **Error Handling:** Comprehensive error handling and user feedback
- **Performance Optimization:** Code splitting and loading states
- **Security Enhancements:** Input validation and security measures
- **Testing & Debugging:** Thorough testing and bug fixes
- **Documentation:** Code documentation and README completion

## 🚀 How to Run the Project

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- Groq API key (optional, has fallback)
- Cloudinary account (for profile images)

### Installation & Setup

```sh
# Clone the repository
git clone https://github.com/kalviumcommunity/S65_Rohit_Kumar_Capstone_Moir.git
cd S65_Rohit_Kumar_Capstone_Moir

# Install dependencies for both client and server
# Client uses npm
cd client && npm install

# Server uses pnpm
cd ../server && pnpm install

# Set up environment variables
# Create .env files in both client and server directories
# See .env.example files for required variables

# Start the development servers
# Terminal 1 - Start backend server (using pnpm)
cd server && pnpm run dev

# Terminal 2 - Start frontend client (using npm)
cd client && npm run dev
```

### Environment Variables

**Server (.env):**
```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Client (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

## 📱 Features Overview

### Core Features
- **Real-time Chat:** Instant messaging with friends
- **Friend System:** Add, manage, and chat with friends
- **AI Assistant:** Get help and suggestions from Mizuki
- **Profile Management:** Update profile and settings
- **Real-time Status:** See when friends are online
- **File Upload:** Profile picture upload

### Advanced Features
- **Typing Indicators:** See when someone is typing
- **Read Receipts:** Know when messages are read
- **Message History:** Complete conversation history
- **Responsive Design:** Works on all devices

---
✨ Project by **Rohit Kumar**

