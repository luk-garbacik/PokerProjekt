//server/lob/game/flow/toShowdown.ts
import type { GameState } from "../../types/lobbyTypes.ts";
import type { Card } from "../../types/lobbyTypes.ts";
import { advancePhase } from "./advancePhase.ts";

export function fastForwardToShowdown(state: GameState, deck: Card[]) {
    while (state.phase !== "river") {
        advancePhase(state, deck);
    }

    console.log("⏩ FAST FORWARD TO RIVER");
}

