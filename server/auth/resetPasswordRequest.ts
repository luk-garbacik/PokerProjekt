import crypto from "crypto";
import { pool } from "../db/db.ts";
import type { Request, Response } from "express";
import { sendResetPasswordEmail } from "./mailer.ts";

export async function resetPasswordRequest(req: Request, res: Response) {
    const { email } = req.body;

    try {

        const result = await pool.query(
            `SELECT id_user FROM users WHERE email = $1`,
            [email]
        );

        // Nie zdradzamy czy email istnieje
        if (result.rows.length > 0) {

            const token = crypto.randomBytes(32).toString("hex");

            await pool.query(
                `UPDATE users
         SET reset_token=$1,
             reset_token_expire=NOW() + INTERVAL '15 minutes'
         WHERE email=$2`,
                [token, email]
            );

            await sendResetPasswordEmail(email, token);
        }

        return res.json({
            message: "Jeśli email istnieje, wysłaliśmy link resetu hasła"
        });

    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
}