// server/lob/game/flow/resetGame.ts

import type {GameState , LobbyPlayer} from "../../types/lobbyTypes.ts";
import {dealCards} from "../deck/deck.deal.ts";
import {postBlinds} from "../blinds/postBlinds.ts";
import { nextDealerIndex } from "./nextDealer.ts";

import { readyPlayers } from "../gameState/readyPlayers.ts";

export function resetGame(
    state: GameState,
    lobbyPlayers: LobbyPlayer[]
) {
    if (state.turnInterval) {
        clearInterval(state.turnInterval);
        state.turnInterval = null;
    }

    state.turnTimeLeft = undefined;
    const ready = readyPlayers.get(state.lobbyId);

    state.players = lobbyPlayers.map(p => ({
        playerId: p.playerId,
        nickname: p.nickname,
        saldo: p.saldo,
        bet: 0,
        folded: !ready?.has(p.playerId),
        allIn: false,
        lastAction: "",
        sittingOut:
            !ready?.has(p.playerId) ||
            p.saldo <= 0,
        totalCommitted: 0
    }));

//     state.players = lobbyPlayers.map(p => ({
//         playerId: p.playerId,
//         nickname: p.nickname,
//         saldo: p.saldo,
//         bet: 0,
//         folded: p.sittingOut,
//         allIn: false,
//         lastAction: "",
//         sittingOut: p.sittingOut,
//         totalCommitted: 0
//     }));

    state.hands = {};

    const activeCount = state.players.filter(p => !p.sittingOut).length;

    if (activeCount < 2) {
        state.phase = "waiting";
        return;
    }

    state.dealerIndex = nextDealerIndex(state);

    state.showdownResolved = false;
    state.endedByFold = false;
    state.pots = [];
    state.currentBet = 0;
    state.communityCards = [];
    state.phase = "preflop";


    state.hasActed = {};
    for (const p of state.players) {
        state.hasActed[p.playerId] = false;
    }

    // 🃏 karty
    const activePlayers = state.players.filter(
        p => !p.sittingOut && p.saldo>0

    );

    const { hands, deck } = dealCards(activePlayers);

    state.deck = deck;
    state.hands = hands;

    // 🪙 blindy
    postBlinds(state, state.smallBlind, state.bigBlind);

}

