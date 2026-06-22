//BlackJackLogic.ts


import type {Card } from "./blackJackTypes.ts";

const suits = ["♠", "♥", "♦", "♣"];
const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

export function createDeck(): Card[] {
    return suits.flatMap(s =>
        values.map(v => ({ suit: s as any, value: v }))
    ).sort(() => Math.random() - 0.5);
}

export function cardValue(card: Card): number {
    if (["J","Q","K"].includes(card.value)) return 10;
    if (card.value === "A") return 11;
    return Number(card.value);
}

export function handValue(hand: Card[]): number {
    let sum = hand.reduce((s,c) => s + cardValue(c), 0);
    let aces = hand.filter(c => c.value === "A").length;

    while (sum > 21 && aces--) sum -= 10;
    return sum;
}
