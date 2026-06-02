// start/start.transaction.ts

export async function loadPlayersAndLobby(client, lobbyId: number) {
    const playersRes = await client.query(
        `SELECT pl.player_id, u.nickname, u.saldo
     FROM player_lobby pl
     JOIN users u ON u.id_user = pl.player_id
     WHERE pl.lobby_id=$1
     ORDER BY pl.joined_at ASC`,
        [lobbyId]
    );

    const players = playersRes.rows.map(r => ({
        playerId: r.player_id,
        nickname: r.nickname,
        saldo: Number(r.saldo),
        sittingOut: Number(r.saldo) <= 0
    }));

    const lobbyRes = await client.query(
        `SELECT small_blind, big_blind FROM poker_lobby WHERE id_lobby=$1`,
        [lobbyId]
    );

    return {
        players,
        smallBlind: lobbyRes.rowCount ? Number(lobbyRes.rows[0].small_blind) : 10,
        bigBlind: lobbyRes.rowCount ? Number(lobbyRes.rows[0].big_blind) : 20
    };
}
