// server/lob/game/showdown/showdown.repository.ts
import { pool } from "../../../db/db.ts";
import type { PotPayout } from "./showdown.logic.ts";

export async function persistShowdownPayouts(
    payouts: PotPayout[]
) {
    for (const payout of payouts) {
        for (const playerId of payout.winnerIds) {
            await pool.query(
                `UPDATE users SET saldo = saldo + $1 WHERE id_user = $2`,
                [payout.amount, playerId]
            );
        }
    }
}
