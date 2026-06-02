import type { GameState } from "../../types/lobbyTypes.ts";

export function startTurnTimer(
    state: GameState,
    onTick: (playerId: number, timeLeft: number) => void,
    onTimeout: (playerId: number) => void
) {
    // 🧹 ZAWSZE czyść stary timer
    if (state.turnInterval) {
        clearInterval(state.turnInterval);
        state.turnInterval = null;
    }

    // ❌ Nie startuj timera jeśli gra nie trwa
    if (state.phase === "waiting") return;
    if (state.phase === "showdown") return;

    const turnIndex = state.currentTurn;
    const player = state.players[turnIndex];

    if (!player) return;
    if (player.folded || player.allIn) return;

    let timeLeft = 30;

    onTick(player.playerId, timeLeft);

    state.turnInterval = setInterval(() => {

        // 🔥 Jeśli tura się zmieniła — zatrzymaj
        if (state.currentTurn !== turnIndex) {
            clearInterval(state.turnInterval!);
            state.turnInterval = null;
            return;
        }

        timeLeft--;

        if (timeLeft <= 0) {
            clearInterval(state.turnInterval!);
            state.turnInterval = null;

            onTick(null, null);
            // ✅ WAŻNE: nie awaitujemy tutaj
            onTimeout(player.playerId);
            return;
        }
        onTick(player.playerId, timeLeft);

    }, 1000);
}