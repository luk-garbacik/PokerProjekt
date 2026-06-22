// disconnect.handler.ts
import { socketMeta } from "../infra/socketMeta.ts";
import { gameStates } from "../game/gameState/gameState.ts";
import { handleDisconnectInGame } from "./disconnect.game.ts";
import { disconnectTransaction } from "./disconnect.transaction.ts";
import { emitFullPlayers } from "../emit/emitFullPlayers.ts";
import { pool } from "../../db/db.ts";
import { removePlayerSocket } from "../infra/socketRegistry.ts";

import { startTurnTimer } from "../game/flow/turnTimer.ts";
import { readyPlayers } from "../game/gameState/readyPlayers.ts";

export async function disconnectHandler(io, socket) {
    const meta = socketMeta.get(socket.id);

    // 🔹 Jeśli nie mamy meta — tylko sprzątanie socketMeta
    if (!meta?.playerId) {
        socketMeta.delete(socket.id);
        return;
    }

    const playerId = meta.playerId;
    const lobbies = Array.from(meta.lobbies);

    // 🔹 Usuwamy powiązania
    socketMeta.delete(socket.id);
    removePlayerSocket(playerId);

    for (const lobbyId of lobbies) {
        const ready = readyPlayers.get(lobbyId);

        if (ready) {
            ready.delete(playerId);

            console.log(
                `[READY] disconnected player ${playerId} from lobby ${lobbyId}`
            );

            console.log(
                `[READY] current ready players:`,
                [...ready]
            );

            if (ready.size === 0) {
                readyPlayers.delete(lobbyId);

                console.log(
                    `[READY] removed empty ready set for lobby ${lobbyId}`
                );
            }
        }

        const client = await pool.connect();
        const state = gameStates.get(lobbyId);

        try {
            await client.query("BEGIN");

            // 🔥 Zatrzymaj timer przed manipulacją stanem
            if (state?.turnInterval) {
                clearInterval(state.turnInterval);
                state.turnInterval = null;
            }

            if (state) {
                await handleDisconnectInGame(io, state, playerId, lobbyId);
            }

            await disconnectTransaction(client, lobbyId, playerId);

            await client.query("COMMIT");

        } catch (err) {
            await client.query("ROLLBACK");
            console.error("disconnect error", { lobbyId, playerId, err });
        } finally {
            client.release();
        }

        await emitFullPlayers(io, lobbyId);

        // 🔥 Restart timera tylko jeśli ma sens
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

                    const { applyGameAction } = await import("../action/action.apply.ts");
                    await applyGameAction(io, lobbyId, timeoutPlayerId, "fold");
                }
            );
        }
    }
}

