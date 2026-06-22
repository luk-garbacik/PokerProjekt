import type {Card} from "../../types/lobbyTypes.ts";

/**
 * Tasuje talię kart symulując wielokrotne "przekładanie" i "cięcie".
 *
 * Metoda zamiast klasycznego Fisher-Yates stara się bardziej
 * przypominać tasowanie przez człowieka.
 *
 * @param deck - Talia do potasowania
 * @param rounds - Ile razy wykonać pełne cięcie i przeplatanie (domyślnie 6)
 * @returns {Card[]} Nowa, przetasowana talia
 */
export function shuffle(deck: Card[], rounds = 6): Card[] {
    let d = [...deck];

    for (let r = 0; r < rounds; r++) {
        const cutPoint = Math.floor(d.length / 2 + (Math.random() * 10 - 5));
        const left = d.slice(0, cutPoint);
        const right = d.slice(cutPoint);

        const shuffled: Card[] = [];

        while (left.length > 0 || right.length > 0) {
            if (left.length > 0 && (right.length === 0 || Math.random() > 0.5)) {
                shuffled.push(left.shift()!);
            }
            if (right.length > 0 && (left.length === 0 || Math.random() > 0.5)) {
                shuffled.push(right.shift()!);
            }
        }

        d = shuffled;

        const cut = Math.floor(Math.random() * d.length);
        d = [...d.slice(cut), ...d.slice(0, cut)];
    }

    return d;
}