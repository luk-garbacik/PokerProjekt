//server/payment/webhook.ts
import Stripe from "stripe";
import { pool } from "../db/db.ts";
import type { Request, Response } from "express";
import { getIO } from "../socketInstance.ts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function stripeWebhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("Webhook signature verification failed.");
        return res.status(400).send("Webhook error");
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;

        const userId = Number(session.metadata.userId);
        const amount = Number(session.metadata.amount);

        try{
            // 🔴 SPRAWDŹ CZY JUŻ ZAKSIĘGOWANE
            const existing = await pool.query(
                `SELECT id FROM transactions WHERE external_id = $1`,
                [session.id]
            );

            if (existing.rowCount > 0) {
                return res.json({ received: true });
            }

            await pool.query("BEGIN");

            const result = await pool.query(
                `UPDATE users 
                 SET saldo = saldo + $1 
                 WHERE id_user = $2 
                 RETURNING saldo`,
                [amount, userId]
            );


            const newSaldo = Number(result.rows[0].saldo);

            await pool.query(
                `INSERT INTO transactions 
                 (user_id, type, amount, status, provider, external_id)
                 VALUES ($1, 'deposit', $2, 'completed', 'stripe', $3)`,
                [userId, amount, session.id]
            );

            await pool.query("COMMIT");
            // 🚀 EMIT DO USERA
            const io = getIO();

            io.to(`user_${userId}`).emit("user:saldoUpdate", {
                userId,
                saldo: newSaldo
            });

        }catch (err){
        await pool.query("ROLLBACK");
        console.error("Webhook DB error:", err);
        return res.status(500).send("Internal error");
        }
    }

    res.json({ received: true });
}
