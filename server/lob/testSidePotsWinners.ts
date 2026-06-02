import type { GameState, Pot} from "./types/lobbyTypes.ts";
import { determineWinner, evaluateHand } from "./pokerWinner.ts";

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
// Mapowanie rankingu na nazwy układów
// =========================
const handRankNames: Record<number, string> = {
    1: "High Card",
    2: "One Pair",
    3: "Two Pair",
    4: "Three of a Kind",
    5: "Straight",
    6: "Flush",
    7: "Full House",
    8: "Four of a Kind",
    9: "Straight Flush",
    10: "Royal Flush"
};

// =========================
// Scenariusze testowe (side pot + hands)
// =========================
const testScenarios: { name: string; state: GameState }[] = [
    {
        name: "Simple all-in with hand evaluation",
        state: {
            players: [
                { playerId: 1, folded: false, totalCommitted: 100 },
                { playerId: 2, folded: false, totalCommitted: 200 },
                { playerId: 3, folded: false, totalCommitted: 300 }
            ],
            hands: {
                1: [{ rank: "A", suit: "♠" }, { rank: "K", suit: "♠" }],
                2: [{ rank: "9", suit: "♠" }, { rank: "8", suit: "♠" }],
                3: [{ rank: "2", suit: "♦" }, { rank: "3", suit: "♣" }]
            },
            communityCards: [
                { rank: "Q", suit: "♠" },
                { rank: "J", suit: "♠" },
                { rank: "10", suit: "♠" },
                { rank: "2", suit: "♦" },
                { rank: "3", suit: "♣" }
            ],
            pots: []
        }
    },
    {
        name: "Folded player ignored",
        state: {
            players: [
                { playerId: 1, folded: true, totalCommitted: 50 },
                { playerId: 2, folded: false, totalCommitted: 150 },
                { playerId: 3, folded: false, totalCommitted: 200 }
            ],
            hands: {
                1: [{ rank: "K", suit: "♣" }, { rank: "K", suit: "♦" }],
                2: [{ rank: "Q", suit: "♠" }, { rank: "Q", suit: "♥" }],
                3: [{ rank: "J", suit: "♣" }, { rank: "10", suit: "♦" }]
            },
            communityCards: [
                { rank: "9", suit: "♠" },
                { rank: "8", suit: "♠" },
                { rank: "7", suit: "♠" },
                { rank: "6", suit: "♣" },
                { rank: "5", suit: "♦" }
            ],
            pots: []
        }
    },
    {
        name: "Multiple all-ins with flush vs straight",
        state: {
            players: [
                { playerId: 1, folded: false, totalCommitted: 50 },
                { playerId: 2, folded: false, totalCommitted: 100 },
                { playerId: 3, folded: false, totalCommitted: 150 },
                { playerId: 4, folded: false, totalCommitted: 200 }
            ],
            hands: {
                1: [{ rank: "2", suit: "♥" }, { rank: "6", suit: "♥" }],
                2: [{ rank: "9", suit: "♣" }, { rank: "10", suit: "♦" }],
                3: [{ rank: "7", suit: "♦" }, { rank: "8", suit: "♦" }],
                4: [{ rank: "J", suit: "♠" }, { rank: "Q", suit: "♠" }]
            },
            communityCards: [
                { rank: "J", suit: "♥" },
                { rank: "Q", suit: "♥" },
                { rank: "K", suit: "♥" },
                { rank: "8", suit: "♣" },
                { rank: "7", suit: "♦" }
            ],
            pots: []
        }
    },
    {
        name: "Three-way tie with multiple pots",
        state: {
            players: [
                { playerId: 1, folded: false, totalCommitted: 100 },
                { playerId: 2, folded: false, totalCommitted: 200 },
                { playerId: 3, folded: false, totalCommitted: 200 }
            ],
            hands: {
                1: [{ rank: "A", suit: "♣" }, { rank: "A", suit: "♦" }],
                2: [{ rank: "K", suit: "♠" }, { rank: "K", suit: "♥" }],
                3: [{ rank: "A", suit: "♥" }, { rank: "A", suit: "♠" }]
            },
            communityCards: [
                { rank: "Q", suit: "♣" },
                { rank: "J", suit: "♦" },
                { rank: "10", suit: "♠" },
                { rank: "9", suit: "♣" },
                { rank: "2", suit: "♦" }
            ],
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
            hands: {
                1: [{ rank: "A", suit: "♠" }, { rank: "K", suit: "♠" }],
                2: [{ rank: "9", suit: "♦" }, { rank: "9", suit: "♣" }]
            },
            communityCards: [
                { rank: "Q", suit: "♠" },
                { rank: "J", suit: "♠" },
                { rank: "10", suit: "♠" },
                { rank: "2", suit: "♣" },
                { rank: "3", suit: "♦" }
            ],
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

    // Tworzymy side poty
    buildSidePots(scenario.state);

    console.log("\nSide pots:");
    scenario.state.pots.forEach(pot => {
        console.log(`Pot ${pot.id}: amount = ${pot.amount}, eligible players = [${pot.eligiblePlayerIds.join(", ")}]`);
    });

    // Obliczenie zwycięzców każdego potu
    scenario.state.pots.forEach(pot => {
        const eligiblePlayers = scenario.state.players.filter(p => pot.eligiblePlayerIds.includes(p.playerId));
        const winnerIds = determineWinner(
            eligiblePlayers,
            scenario.state.communityCards,
            scenario.state.hands
        );

        const totalPot = pot.amount;
        console.log(`\nPot ${pot.id} (total ${totalPot}) -> zwycięzca(i):`);
        if (!winnerIds.length) {
            console.log("Brak zwycięzcy (wszyscy folded lub brak kart).");
        } else {
            winnerIds.forEach(id => {
                const playerHand = scenario.state.hands[id];
                const allCards = [...playerHand, ...scenario.state.communityCards];
                const evalHand = evaluateHand(allCards.slice(0, 5));
                console.log(`Gracz ${id} -> ${playerHand.map(c => c.rank + c.suit).join(", ")} (${handRankNames[evalHand.rank]})`);
            });
        }
    });

    // Łączny total wszystkich potów
    const totalAllPots = scenario.state.pots.reduce((sum, p) => sum + p.amount, 0);
    console.log(`\nŁączna pula wszystkich potów: ${totalAllPots}`);
});
