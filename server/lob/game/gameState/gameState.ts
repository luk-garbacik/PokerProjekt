//server/lob/game/gameState/gameState.ts
import type { GameState } from "../../types/lobbyTypes.ts";

/**
 * Globalna mapa przechowująca aktualny stan gry dla każdego lobby.
 *
 * Klucz: `lobbyId`, wartość: `GameState`.
 */
export const gameStates = new Map<number, GameState>();
