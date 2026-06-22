import type {Card} from "../../types/lobbyTypes";
import {createDeck} from "./deck.factory.ts";
import {shuffle} from "./deck.shuffle.ts";

/**
 * Rozdaje karty prywatne graczom.
 *
 * - Talia jest tworzona i potasowana.
 * - Każdy gracz dostaje po jednej karcie na rundę, aż do liczby `cardsPerPlayer`.
 *
 * @param players - Lista graczy (musi zawierać `playerId`)
 * @param cardsPerPlayer - Ile kart ma otrzymać każdy gracz (domyślnie 2)
 * @returns {Record<number, Card[]>} Mapa `playerId -> karty`
 */
export function dealCards(players: { playerId: number }[], cardsPerPlayer = 2) {
    const deck = shuffle(createDeck());
    const hands: Record<number, Card[]> = {};

    for (const p of players) hands[p.playerId] = [];

    for (let round = 0; round < cardsPerPlayer; round++) {
        for (const p of players) {
            const c = deck.pop();
            if (c) hands[p.playerId].push(c);
        }
    }

    return { hands, deck }; // 👈 zwracamy też pozostałą talię
}