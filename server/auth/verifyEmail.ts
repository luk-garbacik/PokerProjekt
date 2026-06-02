import type { Request, Response } from "express";
import { pool } from "../db/db.ts";

export async function verifyEmail(req: Request, res: Response) {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Brak tokena.");
    }

    const result = await pool.query(
        `SELECT id_user FROM users WHERE verification_token = $1`,
        [token]
    );

    if (result.rows.length === 0) {
        return res.status(400).send("Nieprawidłowy lub wygasły token.");
    }

    await pool.query(
        `UPDATE users
     SET email_verified = true,
         verification_token = NULL
     WHERE verification_token = $1`,
        [token]
    );

    return res.send("Email został zweryfikowany. Możesz się zalogować.");
}