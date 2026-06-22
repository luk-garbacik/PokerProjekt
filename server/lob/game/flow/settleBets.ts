//server/lob/game/flow/settleBets.ts
import type {GameState} from "../../types/lobbyTypes.ts";
import {isInHand} from "./isActive.ts";

/**
 * Rozlicza rundę zakładów:
 * - przenosi wszystkie zakłady do puli,
 * - resetuje zakłady graczy (`bet = 0`),
 * - zeruje `currentBet`,
 * - ustawia `currentTurn` na pierwszego nie-folded gracza.
 *
 * @param state - Aktualny stan gry
 */
export function settleBetsForRound(state: GameState) {
    for (const p of state.players) {
        if (p.bet > 0) {
            p.bet = 0;
        }
    }

    state.currentBet = 0;

    // reset flagi
    state.hasActed = {};
    for (const p of state.players.filter(isInHand)) {
        if (!p.folded && !p.allIn) state.hasActed[p.playerId] = false;
    }
}
