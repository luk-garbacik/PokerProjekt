//server/lob/join/join.emitSnapshot.ts

import { pool } from "../../db/db.ts";
import type { Server } from "socket.io";
import { emitFullPlayers } from "../emit/emitFullPlayers.ts";

export async function emitJoinSnapshot(
    io: Server,
    socket,
    lobbyId: number
) {
    const lobbyRes = await pool.query(
        `SELECT id_lobby, max_players, current_players,
            small_blind, big_blind, entry_fee, private, owner_id
     FROM poker_lobby WHERE id_lobby=$1`,
        [lobbyId]
    );

    const playersRes = await pool.query(
        `SELECT pl.player_id, u.nickname, u.saldo
     FROM player_lobby pl
     JOIN users u ON u.id_user = pl.player_id
     WHERE pl.lobby_id = $1
     ORDER BY pl.joined_at ASC`,
        [lobbyId]
    );

    const players = playersRes.rows.map((r: any) => ({
        playerId: r.player_id,
        nickname: r.nickname,
        saldo: r.saldo
    }));

    await emitFullPlayers(io, lobbyId);

    return {
        lobby: lobbyRes.rows[0],
        players
    };
}
