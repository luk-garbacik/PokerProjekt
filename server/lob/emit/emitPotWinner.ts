import type { Server } from "socket.io";
import type { GameState } from "../types/lobbyTypes.ts";

type Payout = {
    potId: number;
    amount: number;
    winnerIds: number[];
};

export function emitPotWinner(
    io: Server,
    lobbyId: number,
    state: GameState,
    payout: Payout
) {
    io.to(`lobby_${lobbyId}`).emit("potWinner", {
        potIndex: payout.potId,
        amount: payout.amount,
        winnerNicknames: payout.winnerIds.map(
            id => state.players.find(p => p.playerId === id)!.nickname
        )
    });
}
