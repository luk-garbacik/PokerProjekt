//server/auth/logowanie.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import axios from "axios";
import { pool } from "../db/db.ts";
import type { Request, Response } from "express";

export async function logowanie(req: Request, res: Response) {
  const { nickname, password, captchaToken  } = req.body;
  if (!captchaToken) {
    return res.status(400).json({ error: "Captcha wymagane" });
  }

  try {
    // 🔹 WERYFIKACJA CAPTCHA W GOOGLE
    const captchaResponse = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
          params: {
            secret: process.env.RECAPTCHA_SECRET,
            response: captchaToken,
          },
        }
    );
    if (!captchaResponse.data.success) {
      return res.status(400).json({ error: "Niepoprawna captcha" });
    }

    const result = await pool.query(`SELECT * FROM users WHERE nickname = $1`, [
      nickname,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Nie znaleziono użytkownika" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password); 

    if (!match) {
      return res.status(400).json({ error: "Nieprawidłowe hasło" });
    }
    // 🔒 BLOKADA LOGOWANIA BEZ WERYFIKACJI EMAIL
    if (!user.email_verified) {
      return res.status(403).json({
        error: "Konto nie zweryfikowane. Sprawdź email.",
      });
    }
    console.log(`user.email_verified: ${user.email_verified}`);
    console.log(`Użytkownik zalogowany: ${user.nickname} (ID: ${user.id_user}), saldo: ${user.saldo}`);

    const token = jwt.sign(
        {
          id: user.id_user,
          role: user.role,
        },
        process.env.JWT_SECRET || "SUPER_SECRET",
        { expiresIn: "2h" }
    );

    res.json({
      message: `Witam ${user.nickname}`,
      saldo: Number(user.saldo),
      userId: user.id_user,
      role: user.role,
      token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd serwera" });
  }
}
