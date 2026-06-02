//server/lob/game/blinds/postBlinds.ts

import type {GameState} from "../../types/lobbyTypes";
import { nextActivePlayerFrom } from "../flow/nextPlayer.ts";
export function postBlinds(
    state: GameState,
    smallBlind: number,
    bigBlind: number
) {
    //    Zachowujemy ORYGINALNE indeksy w state.players
    const active = state.players
        .map((p, i) => ({ p, i }))
        .filter(x => !x.p.sittingOut && x.p.saldo > 0);

    if (active.length < 2) return;

    //    Szukamy pozycji dealera WŚRÓD AKTYWNYCH
    const dealerPos = active.findIndex(x => x.i === state.dealerIndex);

    //    Zabezpieczenie – jeśli dealer wypadł (np. wyszedł)
    const safeDealerPos = dealerPos === -1 ? 0 : dealerPos;

    //     Liczenie pozycji sb i bb
    const sbPos = (safeDealerPos + 1) % active.length;
    const bbPos = (safeDealerPos + 2) % active.length;

    const sb = active[sbPos].p;
    const bb = active[bbPos].p;

    const sbPaid = Math.min(sb.saldo, smallBlind);
    const bbPaid = Math.min(bb.saldo, bigBlind);

    sb.saldo -= sbPaid;
    sb.bet = sbPaid;
    sb.totalCommitted += sbPaid;
    sb.totalCommitted = Number(sb.totalCommitted);

    bb.saldo -= bbPaid;
    bb.bet = bbPaid;
    bb.totalCommitted += bbPaid;
    bb.totalCommitted = Number(bb.totalCommitted);

    state.currentBet = bbPaid;

    // Preflop ZACZYNA GRACZ PO BB
    const next = nextActivePlayerFrom(state, bb.playerId);
    if (state.players[next] && !state.players[next].allIn) {
        state.currentTurn = next;
    }

    state.hasActed = {};
    state.hasActed[sb.playerId] = true;
    state.hasActed[bb.playerId] = true;
}
