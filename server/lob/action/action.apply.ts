import type { Server } from "socket.io";
import { pool } from "../../db/db.ts";
import { gameStates } from "../game/gameState/gameState.ts";
import { handleAction } from "../game/flow/handleAction.ts";
import { buildSidePots } from "../game/pot/pots.ts";
import { emitPots } from "../emit/emitPots.ts";
import { emitTurn } from "../emit/emitTurn.ts";
import { emitFullPlayers } from "../emit/emitFullPlayers.ts";
import { resolveShowdown } from "../game/flow/resolveShowdown.ts";
import { endHandAndResetIfNeeded } from "../game/flow/endAndReset.ts";
import { persistSaldoDiff } from "./action.transaction.ts";
import { startTurnTimer } from "../game/flow/turnTimer.ts";

export async function applyGameAction(
    io: Server,
    lobbyId: number,
    playerId: number,
    action: string,
    amount?: number
) {
    const state = gameStates.get(lobbyId);
    if (!state) return;

    const player = state.players.find(p => p.playerId === playerId);
    if (!player) return;

    const client = await pool.connect();

    let roundComplete = false;

    const prevTurn = state.currentTurn;
    try {
        await client.query("BEGIN");

        const saldoBefore = player.saldo;

        roundComplete = handleAction(state, playerId, action, amount);

        const saldoAfter = player.saldo;
        const diff = saldoAfter - saldoBefore;

        if (diff !== 0) {
            await persistSaldoDiff(client, diff, playerId);
        }

        await client.query("COMMIT");

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("applyGameAction error:", err);
        return;
    } finally {
        client.release();
    }

    // 📡 EMITY PO COMMIT
    await emitFullPlayers(io, lobbyId);

    io.to(`lobby_${lobbyId}`).emit("playerUpdateBets", {
        players: state.players
    });

    emitTurn(io, lobbyId, state);

    // 🔥 START TIMERA JEŚLI ZMIENIŁA SIĘ TURA
    if (
        state.phase !== "waiting" &&
        state.phase !== "showdown" &&
        prevTurn !== state.currentTurn
    ) {
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
    }

    if (roundComplete) {
        buildSidePots(state);
        emitPots(io, lobbyId, state);

        io.to(`lobby_${lobbyId}`).emit("phaseUpdate", {
            phase: state.phase,
            communityCards: state.communityCards
        });
    }

    if (state.phase === "showdown") {
        await resolveShowdown(io, lobbyId, state);

        setTimeout(async () => {
            await endHandAndResetIfNeeded(io, lobbyId, state);
        }, 5000);
    }
}