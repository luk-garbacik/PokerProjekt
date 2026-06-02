//server/lob/repositories/lobby.repository.ts
import { pool } from "../../db/db.ts";

export async function fetchLobbyPlayers(lobbyId: number) {
    const res = await pool.query(
        `SELECT pl.player_id, u.nickname, u.saldo
     FROM player_lobby pl
     JOIN users u ON u.id_user = pl.player_id
     WHERE pl.lobby_id = $1
     ORDER BY pl.joined_at ASC`,
        [lobbyId]
    );

    return res.rows.map(r => ({
        playerId: r.player_id,
        nickname: r.nickname,
        saldo: Number(r.saldo)
    }));
}
