import type { Server, Socket } from "socket.io";
import { gameStates } from "../game/gameState/gameState.ts";
import { validateAction } from "./action.validator.ts";
import { startTurnTimer } from "../game/flow/turnTimer.ts";
import { applyGameAction } from "./action.apply.ts";

export async function handleMakeAction(
    io: Server,
    socket: Socket,
    { lobbyId, playerId, action, amount }
) {
    const state = gameStates.get(lobbyId);
    if (!state) return;

    if (!validateAction(state, lobbyId, playerId)) return;

    const prevTurn = state.currentTurn;

    // 🔥 wykonanie akcji
    await applyGameAction(io, lobbyId, playerId, action, amount);

    const newTurn = state.currentTurn;

    // 🔥 START TIMER JEŚLI ZMIENIŁA SIĘ TURA
    if (state.phase !== "showdown" && prevTurn !== newTurn) {

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

                // 🧹 bezpieczeństwo
                if (state.turnInterval) {
                    clearInterval(state.turnInterval);
                    state.turnInterval = null;
                }

                // ✅ AUTO FOLD BEZ REKURENCJI
                await applyGameAction(io, lobbyId, timeoutPlayerId, "fold");
            }
        );
    }
}