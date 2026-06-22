// leave.handler.ts
import { pool } from "../../db/db.ts";
import { handleLeaveInGame } from "./leave.game.ts";
import { leaveLobbyTransaction } from "./leave.transaction.ts";
import { emitFullPlayers } from "../emit/emitFullPlayers.ts";
import { socketMeta } from "../infra/socketMeta.ts";
import { gameStates } from "../game/gameState/gameState.ts";
import { startTurnTimer } from "../game/flow/turnTimer.ts";
import { readyPlayers } from "../game/gameState/readyPlayers.ts";

export async function leaveLobbyHandler(io, socket, payload) {
    const { lobbyId, playerId } = payload;
    const client = await pool.connect();
    const state = gameStates.get(lobbyId);

    try {
        await client.query("BEGIN");

        if (state) {
            await handleLeaveInGame(io, state, playerId, lobbyId);
        }

        await leaveLobbyTransaction(client, lobbyId, playerId);

        await client.query("COMMIT");

        socket.leave(`lobby_${lobbyId}`);
        socket.leave(`player_${playerId}`);
        console.error("leaveLobby :");

        const meta = socketMeta.get(socket.id);
        meta?.lobbies.delete(lobbyId);

        const ready = readyPlayers.get(lobbyId);

        if (ready) {
            ready.delete(playerId);

            console.log(
                `[READY] Player ${playerId} removed from lobby ${lobbyId}`
            );

            console.log(
                `[READY] Current ready players:`,
                [...ready]
            );

            if (ready.size === 0) {
                readyPlayers.delete(lobbyId);

                console.log(
                    `[READY] Removed empty ready set for lobby ${lobbyId}`
                );
            }
        }

        await emitFullPlayers(io, lobbyId);

        // 🔥 Restart timera jeśli gra trwa
        if (
            state &&
            state.phase !== "waiting" &&
            state.phase !== "showdown" &&
            state.players.length > 1
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
                    if (!current) return;
                    if (current.playerId !== timeoutPlayerId) return;

                    if (state.turnInterval) {
                        clearInterval(state.turnInterval);
                        state.turnInterval = null;
                    }

                    // auto-fold
                    const { applyGameAction } = await import("../action/action.apply.ts");
                    await applyGameAction(io, lobbyId, timeoutPlayerId, "fold");
                }
            );
        }

    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("leaveLobby error:", err);
        throw err;
    } finally {
        client.release();
    }
}


