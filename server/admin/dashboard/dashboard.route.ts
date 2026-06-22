import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.ts";
import { pool } from "../../db/db.ts";

const router = Router();

router.get("/dashboard-stats", requireAdmin, async (_req, res) => {
    const usersResult = await pool.query(`
        SELECT COUNT(*) AS count
        FROM users
        WHERE role != 'admin'
    `);

    const lobbiesResult = await pool.query(`
        SELECT COUNT(*) AS count
        FROM poker_lobby
        WHERE current_players > 0
    `);

    const turnoverResult = await pool.query(`
        SELECT COALESCE(
            SUM(
                CASE
                    WHEN type = 'deposit' THEN amount
                    WHEN type = 'withdraw' THEN -amount
                    ELSE 0
                END
            ),
            0
        ) AS turnover
        FROM transactions
        WHERE created_at::date = CURRENT_DATE
    `);

    res.json({
        users: Number(usersResult.rows[0].count),
        activeLobbies: Number(lobbiesResult.rows[0].count),
        dailyTurnover: Number(turnoverResult.rows[0].turnover),
    });
});

export default router;