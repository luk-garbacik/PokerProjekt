// server/lob/game/showdown/showdown.logic.ts
import type { GameState } from "../../types/lobbyTypes.ts";
import { determineWinner } from "../../pokerWinner.ts";
import { buildSidePots } from "../pot/pots.ts";

export type PotPayout = {
    potId: number;
    amount: number;
    winnerIds: number[];
};

export function resolveShowdownLogic(state: GameState): PotPayout[] {
    if (state.showdownResolved) return [];
    state.showdownResolved = true;

    buildSidePots(state);

    const payouts: PotPayout[] = [];

    for (const pot of state.pots) {
        let winnerIds: number[];

        if (state.endedByFold) {
            winnerIds = state.players
                .filter(p => !p.folded && !p.sittingOut)
                .map(p => p.playerId);
        } else {
            winnerIds = determineWinner(
                state.players.filter(
                    p => !p.folded && pot.eligiblePlayerIds.includes(p.playerId)
                ),
                state.communityCards,
                state.hands
            );
        }

        const share = Math.floor(pot.amount / winnerIds.length);

        for (const id of winnerIds) {
            const winner = state.players.find(p => p.playerId === id)!;
            winner.saldo += share;
        }

        payouts.push({
            potId: pot.id,
            amount: share,
            winnerIds
        });
    }
    return payouts;
}
