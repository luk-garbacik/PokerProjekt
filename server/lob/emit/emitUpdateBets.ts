import type { Server } from "socket.io";
import type { GameState } from "../types/lobbyTypes.ts";

export function emitPlayerUpdateBets(
    io: Server,
    lobbyId: number,
    state: GameState
) {
    io.to(`lobby_${lobbyId}`).emit("playerUpdateBets", {
        players: state.players
    });
}
