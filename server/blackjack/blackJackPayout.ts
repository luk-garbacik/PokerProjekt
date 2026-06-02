// server/blackjack/blackjackPayout.ts
import { pool } from "../db/db.ts";

export async function applyBlackJackPayout(
    userId: number,
    payout: number
) {
    await pool.query(
        `UPDATE users SET saldo = saldo + $1 WHERE id_user = $2`,
        [payout, userId]
    );
}

