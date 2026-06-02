import bcrypt from "bcrypt";
import { pool } from "../db/db.ts";
import type { Request, Response } from "express";

export async function resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;

    try {
        const result = await pool.query(
            `SELECT id_user FROM users 
       WHERE reset_token=$1
       AND reset_token_expire > NOW()`,
            [token]
        );
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Hasło musi mieć min. 6 znaków" });
        }
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Token nieważny" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE users
       SET password=$1,
           reset_token=NULL,
           reset_token_expire=NULL
       WHERE reset_token=$2`,
            [hashed, token]
        );

        res.json({ message: "Hasło zmienione" });

    } catch (err) {
        res.status(500).json({ error: "Błąd serwera" });
    }
}