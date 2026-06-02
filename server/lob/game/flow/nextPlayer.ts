//server/lob/game/flow/nextPlayer.ts
import type {GameState} from "../../types/lobbyTypes.ts";
import { isInHand} from "./isActive.ts";

export function nextActivePlayerFrom(state: GameState, fromPlayerId: number): number {
    const startIdx = state.players.findIndex(p => p.playerId === fromPlayerId);
    let idx = startIdx;

    for (let i = 0; i < state.players.length; i++) {
        idx = (idx + 1) % state.players.length;
        const p = state.players[idx];
        if (isInHand(p) && !p.allIn) {
            return idx;
        }
    }

    return startIdx;
}
