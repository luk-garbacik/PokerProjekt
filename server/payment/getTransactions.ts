import { pool } from "../db/db.ts";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/requireAuth.ts";

export async function getTransactions(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    try {
        const result = await pool.query(
            `SELECT id, type, amount, status, created_at
             FROM transactions
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera" });
    }
}