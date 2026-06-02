// server/lob/disconnect/disconnect.game.ts

import { handleAction } from "../game/flow/handleAction.ts";
import { endHandAndResetIfNeeded } from "../game/flow/endAndReset.ts";
import { emitTurn } from "../emit/emitTurn.ts";

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
        handleAction(state, playerId, "fold", 0);
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
        setTimeout(() => {
            endHandAndResetIfNeeded(io, lobbyId, state);
        }, 5000);
    }
}