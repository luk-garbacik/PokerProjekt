import type { Card, GameState } from "../../types/lobbyTypes.ts";
import { resetBettingRound } from "./resetBettingRound.ts";

export function advancePhase(state: GameState, deck: Card[]): void {
    switch (state.phase) {
        case "preflop":
            state.phase = "flop";
            state.communityCards.push(...deck.splice(0, 3));
            break;

        case "flop":
            state.phase = "turn";
            state.communityCards.push(deck.splice(0, 1)[0]);
            break;

        case "turn":
            state.phase = "river";
            state.communityCards.push(deck.splice(0, 1)[0]);
            break;

        case "river":
            // ❗ NIE wchodzimy do showdown tutaj
            break;
    }

    resetBettingRound(state);
}
