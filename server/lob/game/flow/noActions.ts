//server/lob/game/flow/noActions.ts
import type {GameState} from "../../types/lobbyTypes.ts";
import {isInHand} from "./isActive.ts";

export function noMoreActionsPossible(state: GameState): boolean {
    const active = state.players.filter(isInHand);

    if (active.length <= 1) return true;

    // gracze którzy MOGĄ jeszcze betować
    const canBet = active.filter(p => !p.allIn);

    // jeżeli <=1 gracz może betować → brak akcji
    return canBet.length <= 1;
}
