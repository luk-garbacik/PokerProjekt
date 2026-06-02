import type { Server } from "socket.io";
import type { GameState } from "../types/lobbyTypes.ts";

export function emitDealCards(
    io: Server,
    lobbyId: number,
    state: GameState
) {
    state.players
        .filter(p => !p.sittingOut && state.hands[p.playerId])
        .forEach(p => {
            io.to(`player_${p.playerId}`).emit("dealCards", {
                playerId: p.playerId,
                cards: state.hands[p.playerId]
            });
        });
}
