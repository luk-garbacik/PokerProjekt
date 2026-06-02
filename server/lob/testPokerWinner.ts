import { determineWinner, evaluateHand } from "./pokerWinner.ts";
import type { GameState} from "./types/lobbyTypes.ts";

// Mapowanie rankingu na nazwy układów
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
// Scenariusze testowe
// =========================
const testScenarios: { name: string; state: GameState }[] = [
  {
    name: "Royal Flush vs Straight Flush",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false },
        { playerId: 3, folded: false }
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
      ]
    }
  },
  {
    name: "Four of a Kind vs Full House",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false },
        { playerId: 3, folded: false },
        { playerId: 4, folded: false }
      ],
      hands: {
        1: [{ rank: "9", suit: "♣" }, { rank: "9", suit: "♦" }],
        2: [{ rank: "K", suit: "♠" }, { rank: "K", suit: "♥" }],
        3: [{ rank: "10", suit: "♣" }, { rank: "J", suit: "♦" }],
        4: [{ rank: "Q", suit: "♣" }, { rank: "J", suit: "♠" }]
      },
      communityCards: [
        { rank: "9", suit: "♥" },
        { rank: "9", suit: "♠" },
        { rank: "K", suit: "♦" },
        { rank: "2", suit: "♣" },
        { rank: "3", suit: "♣" }
      ]
    }
  },
  {
    name: "Flush vs Straight",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false },
        { playerId: 3, folded: false },
        { playerId: 4, folded: false },
        { playerId: 5, folded: false }
      ],
      hands: {
        1: [{ rank: "2", suit: "♥" }, { rank: "6", suit: "♥" }],
        2: [{ rank: "9", suit: "♣" }, { rank: "10", suit: "♦" }],
        3: [{ rank: "7", suit: "♦" }, { rank: "8", suit: "♦" }],
        4: [{ rank: "J", suit: "♠" }, { rank: "Q", suit: "♠" }],
        5: [{ rank: "3", suit: "♣" }, { rank: "4", suit: "♣" }]
      },
      communityCards: [
        { rank: "J", suit: "♥" },
        { rank: "Q", suit: "♥" },
        { rank: "K", suit: "♥" },
        { rank: "8", suit: "♣" },
        { rank: "7", suit: "♦" }
      ]
    }
  },
  {
    name: "Three of a Kind tie with kickers",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false }
      ],
      hands: {
        1: [{ rank: "Q", suit: "♣" }, { rank: "Q", suit: "♦" }],
        2: [{ rank: "Q", suit: "♠" }, { rank: "Q", suit: "♥" }]
      },
      communityCards: [
        { rank: "10", suit: "♣" },
        { rank: "J", suit: "♦" },
        { rank: "2", suit: "♠" },
        { rank: "3", suit: "♣" },
        { rank: "4", suit: "♦" }
      ]
    }
  },
  {
    name: "Two Pair",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false }
      ],
      hands: {
        1: [{ rank: "J", suit: "♠" }, { rank: "10", suit: "♣" }],
        2: [{ rank: "J", suit: "♦" }, { rank: "10", suit: "♦" }]
      },
      communityCards: [
        { rank: "J", suit: "♥" },
        { rank: "10", suit: "♥" },
        { rank: "2", suit: "♣" },
        { rank: "3", suit: "♠" },
        { rank: "4", suit: "♦" }
      ]
    }
  },
  {
    name: "One Pair",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false }
      ],
      hands: {
        1: [{ rank: "J", suit: "♠" }, { rank: "10", suit: "♣" }],
        2: [{ rank: "10", suit: "♦" }, { rank: "9", suit: "♣" }]
      },
      communityCards: [
        { rank: "J", suit: "♥" },
        { rank: "3", suit: "♦" },
        { rank: "2", suit: "♣" },
        { rank: "4", suit: "♠" },
        { rank: "5", suit: "♦" }
      ]
    }
  },
  {
    name: "High Card",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false }
      ],
      hands: {
        1: [{ rank: "A", suit: "♠" }, { rank: "7", suit: "♣" }],
        2: [{ rank: "K", suit: "♦" }, { rank: "9", suit: "♥" }]
      },
      communityCards: [
        { rank: "J", suit: "♥" },
        { rank: "10", suit: "♦" },
        { rank: "9", suit: "♣" },
        { rank: "4", suit: "♠" },
        { rank: "2", suit: "♦" }
      ]
    }
  },
  {
    name: "Straight wheel A-2-3-4-5",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false }
      ],
      hands: {
        1: [{ rank: "A", suit: "♣" }, { rank: "2", suit: "♠" }],
        2: [{ rank: "3", suit: "♥" }, { rank: "4", suit: "♦" }]
      },
      communityCards: [
        { rank: "3", suit: "♠" },
        { rank: "4", suit: "♦" },
        { rank: "5", suit: "♣" },
        { rank: "9", suit: "♠" },
        { rank: "J", suit: "♦" }
      ]
    }
  },
  {
    name: "Tie between players with identical hands",
    state: {
      players: [
        { playerId: 1, folded: false },
        { playerId: 2, folded: false }
      ],
      hands: {
        1: [{ rank: "A", suit: "♠" }, { rank: "K", suit: "♠" }],
        2: [{ rank: "A", suit: "♦" }, { rank: "K", suit: "♦" }]
      },
      communityCards: [
        { rank: "Q", suit: "♠" },
        { rank: "J", suit: "♠" },
        { rank: "10", suit: "♠" },
        { rank: "2", suit: "♣" },
        { rank: "3", suit: "♦" }
      ]
    }
  },
  {
    name: "Folded player should be ignored",
    state: {
      players: [
        { playerId: 1, folded: true },
        { playerId: 2, folded: false }
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
      ]
    }
  },
  {
    name: "Full table multiple winners",
    state: {
      players: Array.from({ length: 4 }, (_, i) => ({ playerId: i + 1, folded: false })),
      hands: {
        1: [{ rank: "A", suit: "♠" }, { rank: "K", suit: "♠" }],
        2: [{ rank: "A", suit: "♦" }, { rank: "K", suit: "♦" }],
        3: [{ rank: "Q", suit: "♣" }, { rank: "J", suit: "♣" }],
        4: [{ rank: "10", suit: "♠" }, { rank: "9", suit: "♠" }]
      },
      communityCards: [
        { rank: "Q", suit: "♠" },
        { rank: "J", suit: "♠" },
        { rank: "10", suit: "♣" },
        { rank: "2", suit: "♣" },
        { rank: "3", suit: "♦" }
      ]
    }
  },
  {
    name: "All players folded",
    state: {
      players: [
        { playerId: 1, folded: true },
        { playerId: 2, folded: true }
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
      ]
    }
  }
];

// =========================
// Uruchomienie scenariuszy
// =========================
testScenarios.forEach((scenario, index) => {
  console.log("\n==============================================");
  console.log(`SCENARIUSZ ${index + 1}: ${scenario.name}`);
  console.log("Community Cards: " + scenario.state.communityCards.map(c => c.rank + c.suit).join(", "));
  console.log("----------------------------------------------");

  scenario.state.players.forEach(player => {
    console.log(`Gracz ${player.playerId} karty: ${scenario.state.hands[player.playerId].map(c => c.rank + c.suit).join(", ")}`);
  });

  // Najlepsze ręce graczy
  const allResults = scenario.state.players.map(player => {
    const allCards = [...scenario.state.hands[player.playerId], ...scenario.state.communityCards];
    const getCombinations = <T>(arr: T[], n: number): T[][] => {
      const results: T[][] = [];
      if (n === 0) return [[]];
      arr.forEach((current, index) => {
        const smaller = getCombinations(arr.slice(index + 1), n - 1);
        smaller.forEach(combo => results.push([current, ...combo]));
      });
      return results;
    };
    const combos = getCombinations(allCards, 5);
    let bestCombo = combos[0];
    let bestEval = evaluateHand(bestCombo);

    for (const combo of combos) {
      const evalHand = evaluateHand(combo);
      if (evalHand.rank > bestEval.rank) {
        bestEval = evalHand;
        bestCombo = combo;
      } else if (evalHand.rank === bestEval.rank) {
        for (let i = 0; i < evalHand.tieValues.length; i++) {
          if ((evalHand.tieValues[i] || 0) > (bestEval.tieValues[i] || 0)) {
            bestEval = evalHand;
            bestCombo = combo;
            break;
          }
          if ((evalHand.tieValues[i] || 0) < (bestEval.tieValues[i] || 0)) break;
        }
      }
    }

    return {
      playerId: player.playerId,
      handCards: bestCombo,
      handRank: bestEval.rank,
      tieValues: bestEval.tieValues
    };
  });

  // Sortowanie graczy po sile ręki
  allResults.sort((a, b) => {
    if (b.handRank !== a.handRank) return b.handRank - a.handRank;
    for (let i = 0; i < Math.max(a.tieValues.length, b.tieValues.length); i++) {
      const ai = a.tieValues[i] || 0;
      const bi = b.tieValues[i] || 0;
      if (bi !== ai) return bi - ai;
    }
    return 0;
  });

  // Ranking graczy
  console.log("\nRanking graczy:");
  allResults.forEach((r, i) => {
    console.log(`${i + 1}. Gracz ${r.playerId}: ${r.handCards.map(c => c.rank + c.suit).join(", ")} (${handRankNames[r.handRank]})`);
  });

  // Wyłonienie zwycięzcy
  const winnerIds = determineWinner(
      scenario.state.players,
      scenario.state.communityCards,
      scenario.state.hands
  );

  console.log("\nZwycięzca:");
  if (!winnerIds.length) {
    console.log("Brak zwycięzcy (wszyscy folded lub brak kart).");
  } else {
    winnerIds.forEach(id => {
      const r = allResults.find(r => r.playerId === id)!;
      console.log(`Gracz ${id} -> ${r.handCards.map(c => c.rank + c.suit).join(", ")} (${handRankNames[r.handRank]})`);
    });
  }
});
