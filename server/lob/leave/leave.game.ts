// leave.game.ts
import { handleAction } from "../game/flow/handleAction.ts";
import { endHandAndResetIfNeeded } from "../game/flow/endAndReset.ts";
import {emitTurn} from "../emit/emitTurn.ts";
import { resolveShowdown } from "../game/flow/resolveShowdown.ts";
export async function handleLeaveInGame(io, state, playerId, lobbyId) {
    const wasCurrentTurn =
        state.players[state.currentTurn]?.playerId === playerId;

    handleAction(state, playerId, "fold", 0);
    console.log("LEAVE PHASE", state.phase);

    const player = state.players.find(p => p.playerId === playerId);
    if (player) {
        player.sittingOut = true;
        player.lastAction = "leave";
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
