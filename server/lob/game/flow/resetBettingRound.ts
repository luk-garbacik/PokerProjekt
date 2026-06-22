//server/lob/game/flow/resetBettingRound.ts
import type { GameState } from "../../types/lobbyTypes.ts";

export function resetBettingRound(state: GameState) {
    state.currentBet = 0;
    state.hasActed = {};

    for (const p of state.players) {
        p.bet = 0;
        p.lastAction = "";
        if (!p.folded && !p.allIn) {
            state.hasActed[p.playerId] = false;
        }
    }
}
