//server/lob/game/flow/endAndReset.ts
import type { Server } from "socket.io";
import type { GameState } from "../../types/lobbyTypes.ts";
import { resetGame} from "./resetGame.ts";
import { emitPots } from "../../emit/emitPots.ts";
import {emitTurn} from "../../emit/emitTurn.ts";
import {emitGameWaiting} from "../../emit/emitGameWaiting.ts";
import {emitDealCards} from "../../emit/emitDealCards.ts";
import {emitNewRound} from "../../emit/emitNewRound.ts";
import {emitPlayerUpdateBets} from "../../emit/emitUpdateBets.ts";

import { persistBlindsTransaction } from "../../repositories/blinds.repository.ts";
import {fetchLobbyPlayers} from "../../repositories/lobby.repository.ts";
import { startTurnTimer } from "./turnTimer.ts";
import { applyGameAction } from "../../action/action.apply.ts";
export async function endHandAndResetIfNeeded(
    io: Server,
    lobbyId: number,
    state: GameState
) {
    const lobbyPlayers = await fetchLobbyPlayers(lobbyId);

    resetGame(
        state,
        lobbyPlayers.map(p => ({
            ...p,
            sittingOut: p.saldo <= 0
        }))
    );

    // 🔥 WYŚLIJ RESET TIMERA
    io.to(`lobby_${lobbyId}`).emit("turnTimerUpdate", {
        playerId: null,
        timeLeft: null
    });

    // 🛑 brak aktywnych → waiting
    if (state.phase === "waiting") {
        emitPots(io, lobbyId, state);
        emitGameWaiting(io, lobbyId);
        return;
    }

    // 🃏 rozdanie kart
    emitDealCards(io, lobbyId, state);

    emitNewRound(io, lobbyId, state);

    // 🪙 blindy (repo)
    await persistBlindsTransaction(state);

    emitPlayerUpdateBets(io, lobbyId, state);

    emitTurn(io, lobbyId, state);
// 🔥 START TIMERA DLA PIERWSZEJ TURY
    startTurnTimer(
        state,
        (playerId, timeLeft) => {
            io.to(`lobby_${lobbyId}`).emit("turnTimerUpdate", {
                playerId,
                timeLeft
            });
        },
        async (timeoutPlayerId) => {
            const current = state.players[state.currentTurn];
            if (!current || current.playerId !== timeoutPlayerId) return;

            if (state.turnInterval) {
                clearInterval(state.turnInterval);
                state.turnInterval = null;
            }

            await applyGameAction(io, lobbyId, timeoutPlayerId, "fold");
        }
    );
    emitPots(io, lobbyId, state);

    console.log(`♻️ Nowa runda w lobby ${lobbyId}`);
}

