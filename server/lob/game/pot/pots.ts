import type { GameState, Pot } from "../../types/lobbyTypes.ts";

export function buildSidePots(state: GameState) {
    const active = state.players
        .filter(p => p.totalCommitted > 0)
        .map(p => ({
            playerId: p.playerId,
            committed: p.totalCommitted,
            folded: p.folded
        }));

    const pots: Pot[] = [];
    let potId = 0;
    let remaining = [...active];

    while (remaining.length > 0) {
        const minCommitted = Math.min(...remaining.map(p => p.committed));
        const contributors = remaining.length;
        const potAmount = minCommitted * contributors;

        const eligiblePlayerIds = remaining
            .filter(p => !p.folded)
            .map(p => p.playerId);

        pots.push({
            id: potId++,
            amount: potAmount,
            eligiblePlayerIds
        });

        remaining = remaining
            .map(p => ({
                playerId: p.playerId,
                committed: p.committed - minCommitted
            }))
            .filter(p => p.committed > 0);
    }

    state.pots = pots;
}
