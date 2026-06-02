// server/lob/game/flow/nextDealer.ts
import type {GameState} from "../../types/lobbyTypes.ts";

export function nextDealerIndex(state: GameState): number {
    const n = state.players.length;

    // 🔒 zabezpieczenie
    let idx =
        Number.isInteger(state.dealerIndex) &&
        state.dealerIndex >= 0 &&
        state.dealerIndex < n
            ? state.dealerIndex
            : -1; // start przed 0

    for (let i = 0; i < n; i++) {
        idx = (idx + 1) % n;
        const p = state.players[idx];
        if (p && !p.sittingOut) {
            return idx;
        }
    }

    // fallback
    return 0;
}
