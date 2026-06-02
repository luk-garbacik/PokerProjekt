//server/lob/game/flow/enterShowdown.ts
import type { GameState } from "../../types/lobbyTypes.ts";

export function enterShowdown(
    state: GameState,
    reason: "river" | "allin" | "fold"
) {
    state.phase = "showdown";
    state.currentTurn = -1;
    state.endedByFold = reason === "fold";
}

