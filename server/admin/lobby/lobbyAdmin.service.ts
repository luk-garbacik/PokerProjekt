// server/admin/lobbyAdmin.service.ts

import { pool } from "../../db/db.ts";
import { leaveLobbyTransaction } from "../../lob/leave/leave.transaction.ts";
import { handleLeaveInGame } from "../../lob/leave/leave.game.ts";
import { emitFullPlayers } from "../../lob/emit/emitFullPlayers.ts";
import { gameStates } from "../../lob/game/gameState/gameState.ts";
import { getIO } from "../../socketInstance.ts";
import { getSocketIdByPlayer } from "../../lob/infra/socketRegistry.ts";

export async function kickPlayer(lobbyId: number, playerId: number) {
    const io = getIO();
    const client = await pool.connect();
    const state = gameStates.get(lobbyId);

    try {
        await client.query("BEGIN");

        // 1️⃣ logika gry (fold + turn + showdown)
        if (state) {
            await handleLeaveInGame(io, state, playerId, lobbyId);
        }

        // 2️⃣ usunięcie z DB + zmniejszenie current_players
        await leaveLobbyTransaction(client, lobbyId, playerId);

        await client.query("COMMIT");

        const socketId = getSocketIdByPlayer(playerId);

        if (socketId) {
            io.to(socketId).emit("kickedFromLobby", { lobbyId });
        }

        io.in(`player_${playerId}`).socketsLeave(`lobby_${lobbyId}`);

        // 4️⃣ aktualizacja listy graczy
        await emitFullPlayers(io, lobbyId);

        return { message: "Gracz usunięty z lobby" };

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}
export async function updateLobby(
    lobbyId: number,
    data: {
        max_players: number;
        small_blind: number;
        private: boolean;
        password: string | null;
        status: string;
    }
) {
    const client = await pool.connect();
    const io = getIO();
    try {
        await client.query("BEGIN");

        // 🔎 Pobierz aktualne dane lobby
        const lobbyResult = await client.query(
            `SELECT current_players FROM poker_lobby WHERE id_lobby = $1`,
            [lobbyId]
        );

        if (!lobbyResult.rows.length) {
            throw new Error("Lobby nie istnieje");
        }

        const currentPlayers = lobbyResult.rows[0].current_players;

        // 🔒 WALIDACJA MAX PLAYERS
        if (data.max_players < 4 || data.max_players > 10) {
            throw new Error("Lobby może mieć od 4 do 10 graczy");
        }

        if (data.max_players < currentPlayers) {
            throw new Error(
                `Nie można ustawić ${data.max_players}. W lobby jest już ${currentPlayers} graczy.`
            );
        }

        // 🔒 WALIDACJA BLINDÓW
        if (data.small_blind <= 0) {
            throw new Error("Small blind musi być > 0");
        }

        // 🔥 WYLICZ BB NA SERWERZE (NIE UFAMY FRONTENDOWI)
        const bigBlind = data.small_blind * 2;

        // 🔒 WALIDACJA HASŁA
        if (data.private && (!data.password || data.password.length !== 6)) {
            throw new Error("Lobby prywatne wymaga hasła (6 znaków)");
        }

        await client.query(
            `UPDATE poker_lobby
             SET max_players = $1,
                 small_blind = $2,
                 big_blind = $3,
                 private = $4,
                 password = $5,
                 status = $6,
                 updated_at = NOW()
             WHERE id_lobby = $7`,
            [
                data.max_players,
                data.small_blind,
                bigBlind,
                data.private,
                data.password,
                data.status,
                lobbyId,
            ]
        );

        await client.query("COMMIT");

        io.to(`lobby_${lobbyId}`).emit("lobbyUpdated", {
            lobbyId,
            max_players: data.max_players,
            small_blind: data.small_blind,
            big_blind: bigBlind,
            status: data.status,
        });

        return { message: "Lobby zaktualizowane" };

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }

}
