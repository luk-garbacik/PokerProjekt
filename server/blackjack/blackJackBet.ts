import { pool } from "../db/db.ts";

export async function applyBlackJackBet(
    userId: number,
    totalBet: number
): Promise<boolean> {

    const result = await pool.query(
        `
        UPDATE users
        SET saldo = saldo - $1
        WHERE id_user = $2
          AND saldo >= $1
        RETURNING saldo
        `,
        [totalBet, userId]
    );

    return result.rowCount === 1;
}
