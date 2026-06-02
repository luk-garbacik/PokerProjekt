import type { GameState, Pot} from "./types/lobbyTypes.ts";

// =========================
// Funkcja budująca side poty
// =========================
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
                committed: p.committed - minCommitted,
                folded: p.folded
            }))
            .filter(p => p.committed > 0);
    }

    state.pots = pots;
}

// =========================
// Testowe scenariusze side potów
// =========================
const testScenarios: { name: string; state: GameState }[] = [
    {
        name: "Simple all-in",
        state: {
            players: [
                { playerId: 1, folded: false, totalCommitted: 100 },
                { playerId: 2, folded: false, totalCommitted: 200 },
                { playerId: 3, folded: false, totalCommitted: 300 }
            ],
            hands: {},
            communityCards: [],
            pots: []
        }
    },
    {
        name: "Folded player ignored",
        state: {
            players: [
                { playerId: 1, folded: true, totalCommitted: 100 },
                { playerId: 2, folded: false, totalCommitted: 200 },
                { playerId: 3, folded: false, totalCommitted: 300 }
            ],
            hands: {},
            communityCards: [],
            pots: []
        }
    },
    {
        name: "Multiple all-ins creating multiple pots",
        state: {
            players: [
                { playerId: 1, folded: false, totalCommitted: 50 },
                { playerId: 2, folded: false, totalCommitted: 150 },
                { playerId: 3, folded: false, totalCommitted: 200 },
                { playerId: 4, folded: false, totalCommitted: 300 }
            ],
            hands: {},
            communityCards: [],
            pots: []
        }
    },
    {
        name: "All folded",
        state: {
            players: [
                { playerId: 1, folded: true, totalCommitted: 50 },
                { playerId: 2, folded: true, totalCommitted: 100 }
            ],
            hands: {},
            communityCards: [],
            pots: []
        }
    }
];

// =========================
// Uruchomienie scenariuszy
// =========================
testScenarios.forEach((scenario, index) => {
    console.log("\n==============================================");
    console.log(`SCENARIUSZ ${index + 1}: ${scenario.name}`);
    console.log("----------------------------------------------");

    scenario.state.players.forEach(p => {
        console.log(`Gracz ${p.playerId} | folded: ${p.folded} | committed: ${p.totalCommitted}`);
    });

    buildSidePots(scenario.state);

    console.log("\nSide pots:");
    scenario.state.pots.forEach(pot => {
        console.log(`Pot ${pot.id}: amount = ${pot.amount}, eligible players = [${pot.eligiblePlayerIds.join(", ")}]`);
    });

    const totalPot = scenario.state.pots.reduce((sum, p) => sum + p.amount, 0);
    console.log(`Total in all pots: ${totalPot}`);
});
