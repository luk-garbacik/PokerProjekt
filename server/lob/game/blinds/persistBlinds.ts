// game/blinds/persistBlinds.ts
import type {GameState} from "../../types/lobbyTypes.ts";

export async function persistBlinds({client, state}: { client: any, state: GameState }) {
    for (const p of state.players) {
        if (p.bet > 0) {
            await client.query(
                `UPDATE users SET saldo = saldo - $1 WHERE id_user = $2`,
                [p.bet, p.playerId]
            );
        }
    }
}
