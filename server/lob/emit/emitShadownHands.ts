import type { Server } from "socket.io";
import type { GameState } from "../types/lobbyTypes.ts";

export function emitShowdownHands(
    io: Server,
    lobbyId: number,
    state: GameState
) {
    io.to(`lobby_${lobbyId}`).emit("showdownHands", {
        lobbyId,
        players: state.players
            .filter(p => !p.folded && !p.sittingOut)
            .map(p => ({
                playerId: p.playerId,
                nickname: p.nickname,
                cards: state.hands[p.playerId]
            })),
        communityCards: state.communityCards
    });
}
