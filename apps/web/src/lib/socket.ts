import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  // Backward-compat singleton. Prefer createSocket for fresh auth contexts.
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });
  }
  return socket;
}

export function createSocket(token?: string): Socket {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });
}
