import {pool} from "../../db/db.ts";
import type { Request, Response } from "express";
import { getPendingWithdraws } from "./withdrawAdmin.service.ts";

export async function approveWithdraw(req: Request, res: Response) {

    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const result = await pool.query(
        "SELECT * FROM transactions WHERE id = $1",
        [id]
    );

    const tx = result.rows[0];

    if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
    }

    if (tx.type !== "withdraw") {
        return res.status(400).json({ error: "Invalid transaction type" });
    }

    if (tx.status !== "pending") {
        return res.status(400).json({ error: "Already processed" });
    }

    try {

        await pool.query("BEGIN");

        await pool.query(
            "UPDATE transactions SET status='completed' WHERE id = $1",
            [id]
        );

        await pool.query("COMMIT");

        res.json({ success: true });

    } catch (err) {

        await pool.query("ROLLBACK");

        res.status(500).json({ error: "Błąd serwera" });

    }

}

export async function getPendingWithdrawsController(
    req: Request,
    res: Response
) {
    try {
        const data = await getPendingWithdraws();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Błąd serwera" });
    }
}

export async function rejectWithdraw(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
    }

    const result = await pool.query(
        "SELECT * FROM transactions WHERE id = $1",
        [id]
    );

    const tx = result.rows[0];

    if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
    }

    if (tx.type !== "withdraw") {
        return res.status(400).json({ error: "Invalid transaction type" });
    }

    if (tx.status !== "pending") {
        return res.status(400).json({ error: "Already processed" });
    }

    try {
        await pool.query("BEGIN");

        // 🔥 zwrot środków
        await pool.query(
            "UPDATE users SET saldo = saldo + $1 WHERE id_user = $2",
            [tx.amount, tx.user_id]
        );

        await pool.query(
            "UPDATE transactions SET status='failed' WHERE id = $1",
            [id]
        );

        await pool.query("COMMIT");

        res.json({ success: true });

    } catch (err) {
        await pool.query("ROLLBACK");
        res.status(500).json({ error: "Błąd serwera" });
    }
}