// start/start.state.ts
import {dealCards} from "../game/deck/deck.deal.ts";
import type { GameState } from "../types/lobbyTypes.ts";

export function buildInitialState(
    lobbyId: number,
    players: any[],
    smallBlind: number,
    bigBlind: number
): GameState {

    const activePlayers = players.filter(p => !p.sittingOut);
    const { hands, deck } = dealCards(activePlayers);

    return {
        lobbyId,
        smallBlind,
        bigBlind,
        players: players.map(p => ({
            playerId: p.playerId,
            nickname: p.nickname,
            saldo: p.saldo,
            bet: 0,
            folded: false,
            allIn: false,
            lastAction: "",
            sittingOut: p.sittingOut,
            totalCommitted: 0
        })),
        pots: [],
        currentBet: 0,
        currentTurn: 0,
        phase: "preflop",
        communityCards: [],
        deck,
        hands,
        hasActed: {}
    };
}
