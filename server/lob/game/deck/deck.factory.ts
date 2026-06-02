import type {Card} from "../../types/lobbyTypes.ts";

/**
 * Tworzy standardową talię 52 kart.
 *
 * @returns {Card[]} Nowa, nietasowana talia
 */
export function createDeck(): Card[] {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    const deck: Card[] = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    return deck;
}