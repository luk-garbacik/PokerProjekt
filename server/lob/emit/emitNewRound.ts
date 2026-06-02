import  type { Server } from "socket.io";
import type { GameState } from "../types/lobbyTypes.ts";

export function emitNewRound(
    io: Server,
    lobbyId: number,
    state: GameState
) {
    io.to(`lobby_${lobbyId}`).emit("newRound", {
        lobbyId,
        communityCards: state.communityCards,
        players: state.players
    });
}
