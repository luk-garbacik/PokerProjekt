// ./lob/pokerWinner.ts
import type { Card, PlayerState} from "./types/lobbyTypes.ts";

const rankOrder = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
function cardValue(card: Card): number { return rankOrder.indexOf(card.rank); }

function getCombinations<T>(arr: T[], n: number): T[][] {
  const results: T[][] = [];
  if (n === 0) return [[]];
  arr.forEach((current, index) => {
    const smaller = getCombinations(arr.slice(index + 1), n - 1);
    smaller.forEach(combo => results.push([current, ...combo]));
  });
  return results;
}

const handRanks: Record<string, number> = {
  "highcard": 1,
  "pair": 2,
  "twopair": 3,
  "three": 4,
  "straight": 5,
  "flush": 6,
  "fullhouse": 7,
  "four": 8,
  "straightflush": 9,
  "royalflush": 10
};

export function evaluateHand(cards: Card[]): { rank: number; tieValues: number[] } {
  const values = cards.map(c => cardValue(c)).sort((a,b) => b-a);
  const suits = cards.map(c => c.suit);

  const counts: Record<number, number> = {};
  values.forEach(v => counts[v] = (counts[v] ?? 0) + 1);

  const countsEntries = Object.entries(counts).map(([v,c]) => ({ value: Number(v), count: c }));
  const sortedByCount = countsEntries.sort((a,b) => b.count - a.count || b.value - a.value);

  const uniqueValues = Array.from(new Set(values)).sort((a,b) => b-a);
  const isFlush = suits.every(s => s === suits[0]);

  let isStraight = false;
  let straightHigh = 0;

  if (uniqueValues.length >= 5) {
    for (let i=0;i<=uniqueValues.length-5;i++) {
      const slice = uniqueValues.slice(i,i+5);
      if (slice[0]-slice[4]===4) { isStraight=true; straightHigh=slice[0]; break; }
    }
    // Wheel A-2-3-4-5
    if (!isStraight && uniqueValues.includes(12) && uniqueValues.includes(3) && uniqueValues.includes(2) && uniqueValues.includes(1) && uniqueValues.includes(0)) {
      isStraight = true; straightHigh = 3;
    }
  }

  // Straight flush / Royal flush
  if (isFlush && isStraight) {
    return {
      rank: straightHigh === 12 ? handRanks["royalflush"] : handRanks["straightflush"],
      tieValues: [straightHigh]
    };
  }

  // Four of a kind
  if (sortedByCount[0].count === 4) {
    const kicker = uniqueValues.filter(v=>v!==sortedByCount[0].value)[0];
    return { rank: handRanks["four"], tieValues: [sortedByCount[0].value, kicker] };
  }

  // Full house
  if (sortedByCount[0].count === 3 && sortedByCount[1].count >= 2) {
    return { rank: handRanks["fullhouse"], tieValues: [sortedByCount[0].value, sortedByCount[1].value] };
  }

  // Flush
  if (isFlush) {
    return { rank: handRanks["flush"], tieValues: values.slice(0,5) }; // najwyższe 5
  }

  // Straight
  if (isStraight) {
    return { rank: handRanks["straight"], tieValues: [straightHigh] };
  }

  // Three of a kind
  if (sortedByCount[0].count === 3) {
    const kickers = uniqueValues.filter(v=>v!==sortedByCount[0].value).slice(0,2);
    return { rank: handRanks["three"], tieValues: [sortedByCount[0].value, ...kickers] };
  }

  // Two pair
  if (sortedByCount[0].count === 2 && sortedByCount[1].count === 2) {
    const highPair = Math.max(sortedByCount[0].value, sortedByCount[1].value);
    const lowPair = Math.min(sortedByCount[0].value, sortedByCount[1].value);
    const kicker = uniqueValues.filter(v=>v!==highPair && v!==lowPair)[0];
    return { rank: handRanks["twopair"], tieValues: [highPair, lowPair, kicker] };
  }

  // One pair
  if (sortedByCount[0].count === 2) {
    const pairValue = sortedByCount[0].value;
    const kickers = uniqueValues.filter(v=>v!==pairValue).slice(0,3);
    return { rank: handRanks["pair"], tieValues: [pairValue, ...kickers] };
  }

  // High card
  return { rank: handRanks["highcard"], tieValues: values.slice(0,5) };
}

export function determineWinner(
    players: PlayerState[],
    communityCards: Card[],
    hands: Record<number, Card[]>
): number[] {

  const results: {
    playerId: number;
    handRank: number;
    tieValues: number[];
  }[] = [];

  for (const player of players) {
    if (player.folded || player.sittingOut) continue;

    const handCards = hands[player.playerId];
    if (!handCards || handCards.length !== 2) continue;

    const allCards = [...handCards, ...communityCards];
    const combos = getCombinations(allCards, 5);

    let bestEval = evaluateHand(combos[0]);

    for (const combo of combos) {
      const evalHand = evaluateHand(combo);
      if (
          evalHand.rank > bestEval.rank ||
          (
              evalHand.rank === bestEval.rank &&
              compareTieValues(evalHand.tieValues, bestEval.tieValues) > 0
          )
      ) {
        bestEval = evalHand;
      }
    }

    results.push({
      playerId: player.playerId,
      handRank: bestEval.rank,
      tieValues: bestEval.tieValues
    });
  }

  if (!results.length) return [];

  const maxRank = Math.max(...results.map(r => r.handRank));
  const top = results.filter(r => r.handRank === maxRank);

  if (top.length === 1) return [top[0].playerId];

  // tie-break
  const best = top.reduce((a, b) =>
      compareTieValues(b.tieValues, a.tieValues) > 0 ? b : a
  );

  return top
      .filter(r => compareTieValues(r.tieValues, best.tieValues) === 0)
      .map(r => r.playerId);
}

function compareTieValues(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av !== bv) return av - bv; // dodatnie = a lepsze
  }
  return 0; // identyczne
}
