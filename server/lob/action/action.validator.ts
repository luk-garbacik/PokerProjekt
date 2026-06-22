// lob/action/action.validator.ts
import type { GameState } from "../types/lobbyTypes.ts";

export function validateAction(
    state: GameState,
    lobbyId: number,
    playerId: number
) {
    // 🚫 BLOKADA AKCJI PODCZAS SHOWDOWN
    if (state.phase === "showdown" || state.currentTurn < 0) {
        console.warn(`⛔ Akcja zablokowana – showdown (lobby ${lobbyId})`);
        return false;
    }

    // ⛔ blokada akcji poza turą
    const currentPlayer = state.players[state.currentTurn];
    if (!currentPlayer || currentPlayer.playerId !== playerId) {
        console.warn("⛔ ACTION REJECTED – not your turn", {
            lobbyId,
            playerId,
            expected: currentPlayer?.playerId
        });
        return false;
    }

    // ⛔ blokada folded / sittingOut
    const actor = state.players.find(p => p.playerId === playerId);
    if (!actor || actor.folded || actor.sittingOut) {
        console.warn("⛔ ACTION REJECTED – player not in hand", {
            lobbyId,
            playerId,
            folded: actor?.folded,
            sittingOut: actor?.sittingOut
        });
        return false;
    }

    return true;
}
