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

// 🔹 LOBBY – REST
app.get("/lobby", lobby);
app.post("/lobby", createLobby);

app.get("/admin/lobbies", requireAdmin, getLobbiesWithPlayers);
app.use("/admin", userAdminRoutes);

// PLATNOSC
app.post("/create-checkout-session", createCheckoutSession);
app.get("/me/saldo", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const result = await pool.query(
      "SELECT saldo FROM users WHERE id_user = $1",
      [userId]
  );

  res.json({ saldo: Number(result.rows[0].saldo) });
});
app.post("/withdraw",requireAuth, withdraw);
app.use("/admin", withdrawAdminRoutes);
app.get("/transactions", requireAuth, getTransactions);

initSockets(io);
initRoulette(io);
initBlackJack(io);



app.use("/admin", lobbyAdminRoutes);
// 🔹 START SERWERA
server.listen(5000, () => {
  console.log("✅ Serwer działa na http://localhost:5000");
});
