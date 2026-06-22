// src/socket.ts
import { io } from "socket.io-client";

export const socket = io(`http://${window.location.hostname}:5000`, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
});

export default socket;
