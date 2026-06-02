//server/lob/emit/emitPots.ts

import {Server} from "socket.io";
import type {GameState} from "../types/lobbyTypes";
export function emitPots(io: Server, lobbyId: number, state: GameState) {
    io.to(`lobby_${lobbyId}`).emit("potsUpdate", {
        pots: state.pots.map((p, index) => ({
            index,
            amount: p.amount,
            eligiblePlayerIds: p.eligiblePlayerIds
        })),
        total: state.pots.reduce((s, p) => s + p.amount, 0)
    });
}