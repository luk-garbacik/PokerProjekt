import bcrypt from "bcrypt";
import { pool } from "../db/db.ts";
import type { Request, Response } from "express";
import crypto from "crypto";
import { sendVerificationEmail } from "./mailer.ts";

export async function rejestracja(req: Request, res: Response) {
  const { nickname, email, phone, password } = req.body;
  if (!nickname || !email || !password) {
    return res.status(400).json({ error: "Wszystkie pola są wymagane" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Niepoprawny email" });
  }
  if (nickname.trim().length < 3) {
    return res.status(400).json({ error: "Nickname za krótki" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const result = await pool.query(
        `INSERT INTO users 
   (nickname, email, password, verification_token, email_verified)
   VALUES ($1, $2, $3, $4, false)
   RETURNING nickname, email`,
        [nickname, email, hashedPassword, verificationToken]
    );

    await sendVerificationEmail(email, nickname, verificationToken);

    res.json({
      message: `Dodano użytkownika ${result.rows[0].nickname}`,
    });

  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Nickname lub email już istnieje!" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Błąd serwera" });
    }
  }
}