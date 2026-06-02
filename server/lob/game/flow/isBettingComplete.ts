//server/lob/game/flow/isBettingComplete.ts
import type { GameState } from "../../types/lobbyTypes.ts";
import {isInHand} from "./isActive.ts";

/**
 * Sprawdza, czy runda zakładów powinna się zakończyć.
 *
 * Zakończenie następuje, gdy:
 * - został 0 lub 1 aktywny gracz (wszyscy inni spasowali lub są all-in),
 * - wszyscy aktywni gracze wyrównali najwyższy zakład (`currentBet`).
 *
 * @param state - Aktualny stan gry
 * @returns {boolean} Czy runda zakładów się zakończyła
 */
export function isBettingRoundComplete(state: GameState): boolean {
    const active = state.players.filter(isInHand);

    if (active.length <= 1) return true;

    // jeśli ktoś jeszcze musi dopłacić do currentBet → runda nie może być zakończona
    const needToMatch = active.filter(
        p => !p.allIn && p.bet < state.currentBet
    );

    if (needToMatch.length > 0) return false;

    // upewnij się, że wszyscy aktywni gracze mieli już swoją turę (pomijamy all-in)
    if (!state.hasActed) return false;
    const needToAct = active.filter(p => !p.allIn && !state.hasActed[p.playerId]);
    return needToAct.length === 0;
}
