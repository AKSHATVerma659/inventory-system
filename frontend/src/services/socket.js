// src/services/socket.js
import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:5000";
const token = localStorage.getItem("token");

const socket = io(WS_URL, {
  auth: { token },
  transports: ["websocket", "polling"]
});

socket.on("connect", () => {
  // console.debug("Socket connected", socket.id);
});

socket.on("connect_error", (err) => {
  // silent - keep polling fallback
  // console.warn("Socket connect error", err.message);
});

export default socket;
