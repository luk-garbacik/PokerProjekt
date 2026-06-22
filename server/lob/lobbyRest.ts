// server/lob/lobbyRest.ts
import { pool } from "../db/db.ts";
import type { Request, Response } from "express";

/**
 * REST endpoint: pobiera listę lobby
 */
export async function lobby(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT id_lobby, max_players, current_players, small_blind, big_blind, entry_fee, private, owner_id
       FROM poker_lobby
       WHERE status = 'open'
       ORDER BY id_lobby ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Błąd w /lobby:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
}


/**
 * REST endpoint: tworzy nowe lobby
 */
export async function createLobby(req: Request, res: Response) {
  try {
    const { owner_id, max_players, small_blind, password } = req.body;
    const isPrivate = req.body.private;

    if (!owner_id || !max_players || !small_blind) {
      return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
    }

    const big_blind = small_blind * 2;
    const lobbyPassword = password ?? null;

    const result = await pool.query(
        `INSERT INTO poker_lobby
         (owner_id, max_players, current_players, small_blind, big_blind, private, password)
         VALUES ($1, $2, 0, $3, $4, $5, $6)
           RETURNING id_lobby, owner_id, max_players, current_players, small_blind, big_blind, private, password`,
        [owner_id, max_players, small_blind, big_blind, isPrivate, lobbyPassword]
    );

    res.json({ ok: true, lobby: result.rows[0] });
  } catch (err) {
    console.error("Błąd w POST /lobby:", err);
    res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
}

export async function getLobbiesWithPlayers(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT
        l.id_lobby,
        l.max_players,
        l.current_players,
        l.small_blind,
        l.big_blind,
        l.status,
        l.private,
        COALESCE(
            json_agg(
                json_build_object(
                    'id_user', u.id_user,
                    'nickname', u.nickname
                )
            ) FILTER (WHERE u.id_user IS NOT NULL),
            '[]'
        ) AS players
      FROM poker_lobby l
             LEFT JOIN player_lobby pl ON l.id_lobby = pl.lobby_id
             LEFT JOIN users u ON pl.player_id = u.id_user
      GROUP BY l.id_lobby
      ORDER BY l.id_lobby;
    `);

    return res.json(result.rows);
  } catch (err) {
    console.error("Błąd getLobbiesWithPlayers:", err);
    res.status(500).json({ error: "Błąd pobierania lobby" });
  }
}

