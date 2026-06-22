// lob/action/action.transaction.ts
import { pool } from "../../db/db.ts";

export async function persistSaldoDiff(
    client,
    diff: number,
    playerId: number
) {
    if (diff === 0) return;

    await client.query(
        `
            UPDATE users
            SET saldo = saldo + $1
            WHERE id_user = $2
        `,
        [diff, playerId]
    );
}

