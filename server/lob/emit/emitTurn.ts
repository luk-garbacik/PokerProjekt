// server/lob/emit/emitTurn.ts
import type { Server } from "socket.io";
import type { GameState } from "../types/lobbyTypes.ts";

export function emitTurn(
    io: Server,
    lobbyId: number,
    state: GameState
) {
    if (
        state.phase === "showdown" ||
        state.phase === "waiting"
    ) {
        return;
    }

    const current = state.players[state.currentTurn];
    if (!current || current.sittingOut || current.folded) return;

    io.to(`lobby_${lobbyId}`).emit("turnUpdate", {
        playerId: current.playerId
    });
}
