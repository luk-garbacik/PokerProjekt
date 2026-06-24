import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});


export async function sendVerificationEmail(
    email: string,
    nickname: string,
    token: string
) {
    const verificationLink = `http://localhost:5000/verify-email?token=${token}`;

    await transporter.sendMail({
        from: '"Poker App" <no-reply@pokerapp.com>',
        to: email,
        subject: "Aktywuj konto",
        html: `
      <h2>Cześć ${nickname}!</h2>
      <p>Kliknij link aby aktywować konto:</p>
      <a href="${verificationLink}">${verificationLink}</a>
    `,
    });
}

export async function sendResetPasswordEmail(
    email: string,
    token: string
) {
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
        from: '"Poker App" <no-reply@pokerapp.com>',
        to: email,
        subject: "Reset hasła",
        html: `
      <h2>Reset hasła</h2>
      <p>Kliknij link aby ustawić nowe hasło:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Link ważny 15 minut.</p>
    `,
    });
}
