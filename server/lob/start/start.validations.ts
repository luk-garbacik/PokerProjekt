// start/start.validation.ts
export function validateStartGame(players: any[]) {
    const activePlayers = players.filter(p => !p.sittingOut);

    if (activePlayers.length < 2) {
        throw new Error("NOT_ENOUGH_ACTIVE_PLAYERS");
    }
}
