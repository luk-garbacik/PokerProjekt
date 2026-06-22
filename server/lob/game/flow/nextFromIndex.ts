//server/lob/game/flow/nextFromIndex.ts
import type {GameState} from "../../types/lobbyTypes.ts";
import {isInHand} from "./isActive.ts";

export function nextActivePlayerFromIndex(state: GameState, fromIndex: number): number {
    const n = state.players.length;
    let idx = fromIndex;

    for (let i = 0; i < n; i++) {
        idx = (idx + 1) % n;
        const p = state.players[idx];
        if (isInHand(p) && !p.allIn) return idx;
    }
    return fromIndex;
}
