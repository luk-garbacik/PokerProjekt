// server/index.ts
import express from "express";
import http from "http";
import cors from "cors";
import { pool } from "./db/db.ts";

import usersRoutes from "./db/user.route.ts";

import { rejestracja } from "./auth/rejestracja.ts";
import { verifyEmail } from "./auth/verifyEmail.ts";

import { logowanie } from "./auth/logowanie.ts";
import { requireAdmin } from "./middleware/requireAdmin.ts";
import lobbyAdminRoutes from "./admin/lobby/lobbyAdmin.route.ts";
import userAdminRoutes from "./admin/users/userAdmin.routes.ts";
import dashboardRoutes from "./admin/dashboard/dashboard.route.ts";

import { lobby, createLobby, getLobbiesWithPlayers } from "./lob/lobbyRest.ts";
import { initSockets } from "./sockets.ts";
import { Server as SocketServer } from "socket.io";
import { setIO } from "./socketInstance.ts";

import { initRoulette } from "./roulette/rouletteSockets.ts";

import { initBlackJack } from "./blackjack/blackjackSockets.ts";

import dotenv from "dotenv";

import { createCheckoutSession } from "./payment/stripe.ts";
import {stripeWebhook} from "./payment/webhook.ts";
import { withdraw } from "./payment/withdraw.ts";
import withdrawAdminRoutes from "./admin/withdraw/withdrawAdmin.route.ts";
import { getTransactions } from "./payment/getTransactions.ts";

import { requireAuth  } from "./middleware/requireAuth.ts";
import type { AuthRequest  } from "./middleware/requireAuth.ts";

import { resetPasswordRequest } from "./auth/resetPasswordRequest.ts";
import { resetPassword } from "./auth/resetPassword.ts";

dotenv.config();

const app = express();
const port = 5000;

app.post(
    "/stripe-webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

app.use(cors({ origin: "*" }));
app.use(express.json());

// Tworzymy serwer HTTP i przekazujemy go do socket.io
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: "*" },
});
setIO(io);

app.use("/api/users", usersRoutes);

// 🔹 REJESTRACJA I LOGOWANIE
app.post("/register", rejestracja);
app.post("/login", logowanie);
app.get("/verify-email", verifyEmail);
// 🔹 RESET HASŁA
app.post("/reset-password-request", resetPasswordRequest);
app.post("/reset-password", resetPassword);

// 🔹 LOBBY
app.get("/lobby", lobby);
app.post("/lobby", createLobby);

// 🔹 PLATNOSC
app.post("/create-checkout-session", createCheckoutSession);
app.get("/me/saldo", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const saldoResult = await pool.query(
        "SELECT saldo FROM users WHERE id_user = $1",
        [userId]
    );

    const frozenResult = await pool.query(
        `
        SELECT COALESCE(SUM(amount),0) AS frozen
        FROM transactions
        WHERE user_id = $1
        AND type = 'withdraw'
        AND status = 'pending'
        `,
        [userId]
    );

    res.json({
        saldo: Number(saldoResult.rows[0].saldo),
        frozen: Number(frozenResult.rows[0].frozen)
    });
});
app.post("/withdraw",requireAuth, withdraw);
app.get("/transactions", requireAuth, getTransactions);

initSockets(io);
initRoulette(io);
initBlackJack(io);

// 🔹 ADMIN
app.get("/admin/lobbies", requireAdmin, getLobbiesWithPlayers);
app.use("/admin", userAdminRoutes);
app.use("/admin", withdrawAdminRoutes);
app.use("/admin", lobbyAdminRoutes);
app.use("/admin", dashboardRoutes);

// 🔹 START SERWERA
server.listen(5000, () => {
  console.log("✅ Serwer działa na http://localhost:5000");
});
