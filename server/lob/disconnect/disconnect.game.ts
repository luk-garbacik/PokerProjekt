// server/lob/disconnect/disconnect.game.ts

import { handleAction } from "../game/flow/handleAction.ts";
import { endHandAndResetIfNeeded } from "../game/flow/endAndReset.ts";
import { emitTurn } from "../emit/emitTurn.ts";
import { resolveShowdown } from "../game/flow/resolveShowdown.ts";

export async function handleDisconnectInGame(io, state, playerId, lobbyId) {

    const wasCurrentTurn =
        state.players[state.currentTurn]?.playerId === playerId;

    // 1️⃣ Jeśli gra trwa — fold
    if (
        state &&
        state.phase !== "waiting" &&
        state.phase !== "showdown" &&
        state.players.length > 1
    ) {
        console.log("🔌 DISCONNECT BEFORE FOLD", {
            playerId,
            phase: state.phase,
            currentTurnPlayer:
                state.players[state.currentTurn]?.playerId,
            players: state.players.map(p => ({
                id: p.playerId,
                folded: p.folded
            }))
        });

        handleAction(state, playerId, "fold", 0);
        console.log("PHASE AFTER HANDLE ACTION", state.phase);

        console.log("🔌 DISCONNECT AFTER FOLD", {
            phase: state.phase,
            currentTurnPlayer:
                state.players[state.currentTurn]?.playerId,
            players: state.players.map(p => ({
                id: p.playerId,
                folded: p.folded
            }))
        });
    }

    // 2️⃣ Usuń gracza z pamięci
    state.players = state.players.filter(p => p.playerId !== playerId);

    // 3️⃣ Korekta indeksu tury
    if (state.players.length === 0) {
        state.currentTurn = 0;
    } else if (state.currentTurn >= state.players.length) {
        state.currentTurn = 0;
    }

    io.to(`lobby_${lobbyId}`).emit("playerUpdateBets", {
        players: state.players
    });

    emitTurn(io, lobbyId, state);

    if (state.phase === "showdown") {
        await resolveShowdown(io, lobbyId, state);

        setTimeout(() => {
            endHandAndResetIfNeeded(io, lobbyId, state);
        }, 5000);
    }
}
