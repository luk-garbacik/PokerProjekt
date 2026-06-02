//server/lob/join/join.transaction.ts
export type JoinLobbyResult =
    | { ok: true }
    | { ok: false; error: string };

export async function joinLobbyTransaction(
    client,
    lobbyId: number,
    playerId: number,
    pin?: string
): Promise<JoinLobbyResult> {
        const lobbyRes = await client.query(
            `SELECT id_lobby, max_players, current_players, private, password
            FROM poker_lobby 
            WHERE id_lobby=$1 FOR UPDATE`,
            [lobbyId]
        );

        if (lobbyRes.rowCount === 0) {
            return { ok: false, error: "Lobby nie istnieje" };
        }

        const lobby = lobbyRes.rows[0];

        const lobbyPin = String(lobby.password ?? "").trim();
        const pinStr = String(pin ?? "").trim();

        if (lobby.private && lobbyPin !== "" && lobbyPin !== pinStr) {
            return { ok: false, error: "Niepoprawny PIN" };
        }

        if (lobby.current_players >= lobby.max_players) {
            return { ok: false, error: "Lobby pełne" };
        }

        const already = await client.query(
            `SELECT 1 FROM player_lobby WHERE player_id=$1 AND lobby_id=$2`,
            [playerId, lobbyId]
        );

        if (already.rowCount === 0) {
            await client.query(
                `INSERT INTO player_lobby (player_id, lobby_id, joined_at)
                VALUES ($1, $2, NOW())`,
                [playerId, lobbyId]
            );

            await client.query(
                `UPDATE poker_lobby
                 SET current_players = current_players + 1
                 WHERE id_lobby=$1`,
                [lobbyId]
            );
        }
    return { ok: true };
}
