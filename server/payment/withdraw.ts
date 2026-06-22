import { pool } from "../db/db.ts";
import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/requireAuth.ts";

export async function withdraw(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { amount } = req.body;
    const amountNumber = Number(amount);

    if (!amountNumber || isNaN(amountNumber) || amountNumber <= 0) {
        return res.status(400).json({ error: "Niepoprawna kwota" });
    }

    try {
        await pool.query("BEGIN");

        // 🔒 blokada rekordu (ważne!)
        const result = await pool.query(
            "SELECT saldo FROM users WHERE id_user = $1 FOR UPDATE",
            [userId]
        );

        const saldo = Number(result.rows[0].saldo);

        if (saldo < amountNumber) {
            await pool.query("ROLLBACK");
            return res.status(400).json({ error: "Brak środków" });
        }

        // 🔥 odejmujemy od razu!
        await pool.query(
            "UPDATE users SET saldo = saldo - $1 WHERE id_user = $2",
            [amountNumber, userId]
        );

        // zapisujemy pending
        await pool.query(
            `INSERT INTO transactions
             (user_id, type, amount, status)
             VALUES ($1, 'withdraw', $2, 'pending')`,
            [userId, amountNumber]
        );

        await pool.query("COMMIT");

        res.json({
            message: "Wniosek o wypłatę wysłany",
            saldo: saldo - amountNumber
        });

    } catch (err) {
        await pool.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: "Błąd serwera" });
    }
}