import type { Server } from "socket.io";

export function emitGameWaiting(io: Server, lobbyId: number) {
    io.to(`lobby_${lobbyId}`).emit("gameWaiting", { lobbyId });
}
