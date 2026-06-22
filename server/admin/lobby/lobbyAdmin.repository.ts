import { pool } from "../../db/db.ts";

export async function getLobbyById(lobbyId: number) {
    const result = await pool.query(
        `SELECT * FROM poker_lobby WHERE id_lobby = $1`,
        [lobbyId]
    );
    return result.rows[0];
}

export async function getLobbyPlayerCount(lobbyId: number) {
    const result = await pool.query(
        `SELECT COUNT(*) FROM player_lobby WHERE lobby_id = $1`,
        [lobbyId]
    );
    return Number(result.rows[0].count);
}

export async function removePlayerFromLobby(playerId: number) {
    await pool.query(
        `DELETE FROM player_lobby WHERE player_id = $1`,
        [playerId]
    );
}

export async function decrementCurrentPlayers(lobbyId: number) {
    await pool.query(
        `UPDATE poker_lobby
         SET current_players = GREATEST(current_players - 1, 0),
             updated_at = NOW()
         WHERE id_lobby = $1`,
        [lobbyId]
    );
}

export async function updateLobbyStatus(lobbyId: number, status: string) {
    await pool.query(
        `UPDATE poker_lobby
         SET status = $1,
             updated_at = NOW()
         WHERE id_lobby = $2`,
        [status, lobbyId]
    );
}

export async function updateLobbySettings(
    lobbyId: number,
    data: {
        max_players: number;
        small_blind: number;
        big_blind: number;
        private: boolean;
        password: string | null;
    }
) {
    await pool.query(
        `UPDATE poker_lobby
         SET max_players = $1,
             small_blind = $2,
             big_blind = $3,
             private = $4,
             password = $5,
             updated_at = NOW()
         WHERE id_lobby = $6`,
        [
            data.max_players,
            data.small_blind,
            data.big_blind,
            data.private,
            data.password,
            lobbyId,
        ]
    );
}
