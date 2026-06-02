//server/payment/stripe.ts
import Stripe from "stripe";
import type { Request, Response } from "express";
import { pool } from "../db/db.ts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(req: Request, res: Response) {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
            {
                price_data: {
                    currency: "pln",
                    product_data: {
                        name: "Doładowanie salda",
                    },
                    unit_amount: amount * 100, // Stripe używa centów
                },
                quantity: 1,
            },
        ],
        metadata: {
            userId: String(userId),
            amount: String(amount),
        },
        success_url: "http://localhost:3000/?payment=success",
        cancel_url: "http://localhost:3000/cancel",
    });

    res.json({ url: session.url });
}
