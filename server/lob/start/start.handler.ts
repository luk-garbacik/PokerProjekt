// start/start.handler.ts
import { pool } from "../../db/db.ts";
import { gameStates } from "../game/gameState/gameState.ts";
import { loadPlayersAndLobby } from "./start.transaction.ts";
import { buildInitialState } from "./start.state.ts";
import { applyBlindsIfPossible } from "./start.blinds.ts";
import { emitStartGame } from "./start.emit.ts";
import { validateStartGame } from "./start.validations.ts";

export async function startGameHandler(io, socket, lobbyId: number) {
    const client = await pool.connect();

    try {
        const { players, smallBlind, bigBlind } =
            await loadPlayersAndLobby(client, lobbyId);

        validateStartGame(players);

        const state = buildInitialState(
            lobbyId,
            players,
            smallBlind,
            bigBlind
        );

        await applyBlindsIfPossible(client, io, state);

        gameStates.set(lobbyId, state);

        emitStartGame(io, lobbyId, state);

        console.log(`🎴 Start gry w lobby ${lobbyId}`);
    } catch (err: any) {
        if (err.message === "NOT_ENOUGH_ACTIVE_PLAYERS") {
            socket.emit("error", "Minimum 2 aktywnych graczy wymagane");
            return;
        }

        console.error(err);
        socket.emit("error", "Błąd startu gry");
    } finally {
        client.release();
    }
}
