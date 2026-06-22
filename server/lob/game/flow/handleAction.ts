// server/lob/game/flow/handleAction.ts
// 🔹 Obsługa akcji

import type {GameState} from "../../types/lobbyTypes.ts";
import {isBettingRoundComplete} from "./isBettingComplete.ts";
import {settleBetsForRound} from "./settleBets.ts";
import {nextActivePlayerFromIndex} from "./nextFromIndex.ts";
import { fastForwardToShowdown } from "./toRiver.ts";
import { noMoreActionsPossible } from "./noActions.ts";
import { advancePhase} from "./advancePhase.ts";
import { isInHand} from "./isActive.ts";
import {enterShowdown} from "./enterShowdown.ts";
import {clearInterval} from "node:timers";
/**
 * Obsługuje akcję gracza (fold, check, call, raise, all-in).
 *
 * Logika:
 * - **fold** – gracz odpada z rozdania,
 * - **check** – możliwe tylko, jeśli gracz już wyrównał najwyższy zakład,
 * - **call** – gracz wyrównuje aktualny zakład (`currentBet`),
 * - **raise** – gracz podbija stawkę (wymaga dodatkowych środków),
 * - **allin** – gracz wykłada wszystkie pozostałe żetony.
 *
 * Po każdej akcji:
 * - Ustala następnego gracza (`nextActivePlayer`),
 * - Sprawdza, czy runda się zakończyła (`isBettingRoundComplete`),
 * - Jeśli tak → rozlicza rundę (`settleBetsForRound`).
 *
 * @param state - Aktualny stan gry
 * @param playerId - ID gracza wykonującego akcję
 * @param action - Typ akcji ("fold" | "check" | "call" | "raise" | "allin")
 * @param amount - Kwota (używana przy raise)
 * @returns {boolean} true jeśli runda zakładów się zakończyła
 */
export function handleAction(
    state: GameState,
    playerId: number,
    action: "fold" | "check" | "call" | "raise" | "allin",
    amount?: number
): boolean {

    const playerIndex = state.players.findIndex(p => p.playerId === playerId);
    if (playerIndex === -1) return false;

    console.log("🎯 ACTION", {
        action,
        playerId,
        currentTurnPlayer:
            state.players[state.currentTurn]?.playerId
    });
    // ⛔ nie jego tura
    if (state.currentTurn !== playerIndex) {
        console.warn("⛔ handleAction rejected – not currentTurn", {
            playerId,
            currentTurn: state.players[state.currentTurn]?.playerId
        });
        return false;
    }

    const player = state.players[playerIndex];
    if (player.folded) return false;

    switch (action) {
        case "fold":
            player.folded = true;
            player.lastAction = "fold";
            break;

        case "check":
            if (player.bet < state.currentBet) return false;
            player.lastAction = "check";
            break;

        case "call": {
            const toCall = state.currentBet - player.bet;

            if (toCall <= 0) {
                player.lastAction = "check";
                break;
            }

            if (player.saldo <= toCall) {
                const paid = player.saldo;
                player.bet += paid;
                player.bet = Number(player.bet) || 0;
                player.totalCommitted += paid;
                player.totalCommitted = Number(player.totalCommitted) || 0;
                player.saldo = 0;
                player.allIn = true;
            } else {
                player.saldo -= toCall;
                player.saldo = Number(player.saldo) || 0;
                player.bet += toCall;
                player.bet = Number(player.bet) || 0;
                player.totalCommitted += toCall;
                player.totalCommitted = Number(player.totalCommitted) || 0;
            }

            player.lastAction = "call";
            break;
        }



        case "raise": {
            if (!amount || amount <= 0) return false;
            const toCall = state.currentBet - player.bet;
            const totalNeeded = toCall + amount;
            if (player.saldo <= toCall) {
                const paid = player.saldo;
                player.bet += paid;
                player.totalCommitted += paid;
                player.bet = Number(player.bet) || 0;
                player.totalCommitted = Number(player.totalCommitted) || 0;
                player.saldo = 0;
                player.allIn = true;
                if (player.bet > state.currentBet) state.currentBet = player.bet;
            } else {
                const actualRaise = Math.min(amount, player.saldo - toCall);
                const paid = toCall + actualRaise;
                player.saldo -= paid;
                player.saldo = Number(player.saldo) || 0;

                player.bet += paid;
                player.bet = Number(player.bet) || 0;

                player.totalCommitted += paid;
                player.totalCommitted = Number(player.totalCommitted) || 0;

                state.currentBet = player.bet;
                if (player.saldo === 0) player.allIn = true;
                player.lastAction = `raise ${amount}`;
            }
            break;
        }

        case "allin": {
            const paid = player.saldo;
            player.bet += paid;
            player.bet = Number(player.bet) || 0;

            player.saldo = 0;
            player.totalCommitted += paid;
            player.totalCommitted = Number(player.totalCommitted) || 0;

            player.allIn = true;
            if (player.bet > state.currentBet) state.currentBet = player.bet;
            player.lastAction = `all-in`;
            break;
        }
    }

    if (!state.hasActed) state.hasActed = {};
    state.hasActed[player.playerId] = true;

    const fromIndex = state.players.findIndex(p => p.playerId === playerId);
    state.currentTurn = nextActivePlayerFromIndex(state, fromIndex);
    console.log(
        "🔄 CURRENT TURN:",
        state.players[state.currentTurn]?.playerId
    );

    // 🔥 SPRAWDZENIE CZY ZOSTAŁ 1 GRACZ
    const activePlayers = state.players.filter(p => !p.folded);

    console.log(
        "👥 ACTIVE PLAYERS",
        activePlayers.map(p => ({
            id: p.playerId,
            folded: p.folded
        }))
    );

    console.log("ACTIVE COUNT", activePlayers.length);

    if (activePlayers.length === 1) {
        console.log("ENTER SHOWDOWN FROM FOLD");

        enterShowdown(state, "fold");

        console.log("PHASE AFTER ENTER", state.phase);

        return true;
    }
    const roundComplete = isBettingRoundComplete(state);

    if (roundComplete) {
        settleBetsForRound(state);

        const active = state.players.filter(isInHand);

        // 🟥 tylko jeden gracz → fold win
        if (active.length === 1) {
            enterShowdown(state, "fold");
            return true;
        }

        if (noMoreActionsPossible(state)) {
            fastForwardToShowdown(state, state.deck);
            enterShowdown(state, "allin");
            return true;
        }

        // normalna gra
        const prevPhase = state.phase;

        advancePhase(state, state.deck);

        // jeżeli ZAKOŃCZYLIŚMY rundę betów na river
        if (prevPhase === "river") {
            enterShowdown(state, "river");
        }
        return true;
    }


    const amountDisplay = amount ? `${amount}` : "0";

    return roundComplete;
}
