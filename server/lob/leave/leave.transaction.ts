// leave.transaction.ts
export async function leaveLobbyTransaction(
    client,
    lobbyId: number,
    playerId: number
) {
    const delRes = await client.query(
        `DELETE FROM player_lobby WHERE player_id=$1 AND lobby_id=$2`,
        [playerId, lobbyId]
    );

    if (delRes.rowCount > 0) {
        await client.query(
            `UPDATE poker_lobby
             SET current_players = GREATEST(current_players - 1, 0)
             WHERE id_lobby=$1`,
            [lobbyId]
        );
    }
}
