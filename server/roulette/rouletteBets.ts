// rouletteBets.ts
import { pool } from "../db/db.ts";
import type { Server, Socket } from "socket.io";
import { rouletteState } from "./rouletteState.ts";

export function initRouletteBets(socket: Socket, io: Server) {

    socket.on("placeRouletteBet", async (bet, cb) => {
        try {
            if (rouletteState.spinning || rouletteState.bettingClosed) {
                return cb({ ok: false, error: "BETTING_CLOSED" });
            }
            console.log("placeRouletteBet received from client:", bet);

            const userId = bet?.userId;
            const betType = bet?.betType;
            const betValue = Number(bet?.betValue);
            const amount = Number(bet?.amount);


            if (!userId || !betType || typeof betValue === "undefined" || Number.isNaN(amount) || amount <= 0) {
                return cb?.({ ok: false, error: "Invalid payload" });
            }

            // zaklad kolorowy
            if (betType === "color" && ![0, 1, 2].includes(betValue)) {
                return cb?.({ ok: false, error: "Invalid color value" });
            }

            // zaklad numeryczny
            if (betType === "number" && (betValue < 0 || betValue > 36)) {
                return cb?.({ ok: false, error: "Invalid number value" });
            }

            // zaklad parzysty
            if (betType === "parity" && ![1, 2].includes(betValue)) {
                return cb?.({ ok: false, error: "Invalid parity value" });
            }

            // zaklad parzysty
            if (betType === "1to18" && ![1, 2].includes(betValue)) {
                return cb?.({ ok: false, error: "Invalid parity value" });
            }

            // dozen: 1=1-12, 2=13-24, 3=25-36
            if (betType === "dozen" && ![1, 2, 3].includes(betValue)) {
                return cb({ ok: false, error: "Invalid dozen" });
            }

            // column: 1,2,3
            if (betType === "column" && ![1, 2, 3].includes(betValue)) {
                return cb({ ok: false, error: "Invalid column" });
            }
            if (betType === "column") {
                console.log(`User ${userId} stawia na kolumnę: ${betValue}`);
            }

            // 1. Pobierz aktualne saldo
            const balRes = await pool.query(
                `SELECT saldo FROM users WHERE id_user = $1`,
                [userId]
            );

            if (balRes.rows.length === 0) {
                return cb?.({ ok: false, error: "User not found" });
            }

            const saldo = balRes.rows[0].saldo;

            if (saldo < amount) {
                return cb?.({ ok: false, error: "Insufficient balance" });
            }

            // 2. Odejmij saldo 
            const updateRes = await pool.query(
                `UPDATE users 
                 SET saldo = saldo - $1 
                 WHERE id_user = $2 AND saldo >= $1 
                 RETURNING saldo`,
                [amount, userId]
            );

            // jeśli coś poszło nie tak
            if (updateRes.rowCount === 0) {
                return cb?.({ ok: false, error: "Insufficient balance" });
            }

            // 🔥 EMIT SALDA DO PANELU
            const newSaldo = updateRes.rows[0].saldo;

            io.emit("playerUpdateFull", {
                lobbyId: null,
                players: [{
                    playerId: userId,
                    saldo: newSaldo
                }]
            });

            // 3. Wstaw zakład
            await pool.query(
                `INSERT INTO roulette_bets (id_user, bet_type, bet_value, amount)
                 VALUES ($1, $2, $3, $4)`,
                [userId, betType, betValue, amount]
            );

            // 4. Pobierz wszystkie niezakończone zakłady
            const updated = await pool.query(
                `SELECT * FROM roulette_bets WHERE round_id IS NULL`
            );

             // aktualizacja EVEN/ODD 
            const currentBets = calculateCurrentBets(updated.rows); 

            io.emit("rouletteBetsUpdated", { currentBets });
        
            cb?.({ ok: true });

        } catch (e) {
            console.error("placeRouletteBet error:", e);
            cb?.({ ok: false, error: "Insert failed" });
        }
    });

    // --------------------------------------------
    //  FUNKCJA PRZELICZAJĄCA WSZYSTKIE AKTUALNE ZAKŁADY
    // --------------------------------------------
    function calculateCurrentBets(rows: any[]) {
        // pomocnicza funkcja — gwarantuje liczby
        const n = (x: any) => Number(x || 0);

        // zakłady kolorów
        const red = rows
            .filter(b => b.bet_type === "color" && b.bet_value === 1)
            .reduce((sum, b) => sum + n(b.amount), 0);

        const black = rows
            .filter(b => b.bet_type === "color" && b.bet_value === 2)
            .reduce((sum, b) => sum + n(b.amount), 0);

        const green = rows
            .filter(b => b.bet_type === "color" && b.bet_value === 0)
            .reduce((sum, b) => sum + n(b.amount), 0);

        // zakłady numeryczne
        const numbersTotal = rows
            .filter(b => b.bet_type === "number")
            .reduce((s, b) => s + n(b.amount), 0);

        // zaklady parzysta/nieparzysta
         const even = rows
            .filter(b => b.bet_type === "parity" && b.bet_value === 1)  // EVEN = 1
            .reduce((sum, b) => sum + n(b.amount), 0);

        const odd = rows
            .filter(b => b.bet_type === "parity" && b.bet_value === 2)  // ODD = 2
            .reduce((sum, b) => sum + n(b.amount), 0);

        // zaklady 1to18/19to36
        const firstHalf = rows
            .filter(b => b.bet_type === "1to18" && b.bet_value === 1)  // 1to18 = 1
            .reduce((sum, b) => sum + n(b.amount), 0);

        const secondHalf = rows
            .filter(b => b.bet_type === "1to18" && b.bet_value === 2)  // 19to36 = 2
            .reduce((sum, b) => sum + n(b.amount), 0);

        // dozen: 1=1-12, 2=13-24, 3=25-36
        const dozen1 = rows
            .filter(b => b.bet_type === "dozen" && b.bet_value === 1)
            .reduce((s, b) => s + n(b.amount), 0);

        const dozen2 = rows
            .filter(b => b.bet_type === "dozen" && b.bet_value === 2)
            .reduce((s, b) => s + n(b.amount), 0);

        const dozen3 = rows
            .filter(b => b.bet_type === "dozen" && b.bet_value === 3)
            .reduce((s, b) => s + n(b.amount), 0);

        // column: 1,2,3
        const column1 = rows
            .filter(b => b.bet_type === "column" && b.bet_value === 1)
            .reduce((s, b) => s + n(b.amount), 0);

        const column2 = rows
            .filter(b => b.bet_type === "column" && b.bet_value === 2)
            .reduce((s, b) => s + n(b.amount), 0);

        const column3 = rows
            .filter(b => b.bet_type === "column" && b.bet_value === 3)
            .reduce((s, b) => s + n(b.amount), 0);


        // całkowita pula
        const total =
            red +
            black +
            green +
            even +
            odd +
            firstHalf +
            secondHalf +
            numbersTotal+
            dozen1 +
            dozen2 +
            dozen3 +
            column1 +
            column2 +
            column3;

        return {
            red,
            black,
            green,
            even,
            odd,
            firstHalf,
            secondHalf,
            numbersTotal,

            dozen1,
            dozen2,
            dozen3,

            column1,
            column2,
            column3,

            total
        };
    }

}
