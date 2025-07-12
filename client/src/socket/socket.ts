import { io, Socket } from "socket.io-client";

// Global socket instance
let socket: Socket | null = null;
// Track connections to prevent duplicate event handlers
let connectedComponents: number = 0;

export const initializeSocket = () => {
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";

  // Check if socket exists AND is connected
  if (socket && socket.connected) {
    console.log("Socket already connected, reusing");
    return socket;
  }

  // Disconnect existing socket if not connected
  if (socket && !socket.connected) {
    console.log("Socket exists but not connected, recreating");
    socket.disconnect();
    socket = null;
  }

  // Create new socket connection
  if (!socket) {
    console.log("Creating new socket connection");
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Add global event listeners for debugging
    socket.on("connect", () => console.log("Socket connected"));
    socket.on("disconnect", () => console.log("Socket disconnected"));
    socket.on("error", (err) => console.error("Socket error:", err));
    socket.on(
      "reconnect",
      (attempt) =>
        console.log("Socket reconnected after", attempt, "attempts")
    );
    socket.on(
      "reconnect_error",
      (err) => console.error("Socket reconnect error:", err)
    );
  }

  return socket;
};

export const connectSocket = (token: string) => {
  const socket = initializeSocket();
  socket.auth = { token };

  // Connect if not connected
  if (!socket.connected) {
    console.log("Connecting socket with token");
    socket.connect();
  }

  // Only increment if actually connecting
  if (!socket.connected) {
    connectedComponents++;
    console.log(`Component connected to socket (total: ${connectedComponents})`);
  }

  return socket;
};

export const disconnectSocket = (isComponentUnmount = true) => {
  // Only track component disconnections by default
  if (isComponentUnmount) {
    connectedComponents = Math.max(0, connectedComponents - 1);
    console.log(
      `Component disconnected from socket (remaining: ${connectedComponents})`
    );

    // Only actually disconnect if no components are using the socket
    if (connectedComponents === 0 && socket) {
      console.log("No components using socket, disconnecting");
      socket.disconnect();
      socket = null;
    }
  } else {
    // Force disconnect (e.g., on logout)
    if (socket) {
      console.log("Forcing socket disconnection");
      socket.disconnect();
      socket = null;
      connectedComponents = 0;
    }
  }
};

export const getSocket = () => socket;

export default socket;
