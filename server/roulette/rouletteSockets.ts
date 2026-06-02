//rouletteSockets.ts

import { Server, Socket } from "socket.io";
import { pool } from "../db/db.ts";
import { initRouletteBets } from "./rouletteBets.ts";
import { payoutRouletteBets } from "./rouletteWinner.ts";
import { rouletteState } from "./rouletteState.ts";

const ROUND_TIME = 43_000;
const CLOSE_BEFORE_SPIN = 5_000; // 5s przed spinem

const rouletteSlots = [
    { number: 0, color: "green" },
    { number: 32, color: "red" },
    { number: 15, color: "black" },
    { number: 19, color: "red" },
    { number: 4, color: "black" },
    { number: 21, color: "red" },
    { number: 2, color: "black" },
    { number: 25, color: "red" },
    { number: 17, color: "black" },
    { number: 34, color: "red" },
    { number: 6, color: "black" },
    { number: 27, color: "red" },
    { number: 13, color: "black" },
    { number: 36, color: "red" },
    { number: 11, color: "black" },
    { number: 30, color: "red" },
    { number: 8, color: "black" },
    { number: 23, color: "red" },
    { number: 10, color: "black" },
    { number: 5, color: "red" },
    { number: 24, color: "black" },
    { number: 16, color: "red" },
    { number: 33, color: "black" },
    { number: 1, color: "red" },
    { number: 20, color: "black" },
    { number: 14, color: "red" },
    { number: 31, color: "black" },
    { number: 9, color: "red" },
    { number: 22, color: "black" },
    { number: 18, color: "red" },
    { number: 29, color: "black" },
    { number: 7, color: "red" },
    { number: 28, color: "black" },
    { number: 12, color: "red" },
    { number: 35, color: "black" },
    { number: 3, color: "red" },
    { number: 26, color: "black" },
];

let spinInProgress = false;

async function performSpin(io: Server) {
    const result = Math.floor(Math.random() * 37);
    const slot = rouletteSlots.find(s => s.number === result);
    const color = slot?.color ?? "green";
    const parity = result === 0 ? "none" : result % 2 === 0 ? "even" : "odd";
    const halfs = result === 0 ? "none" : result <= 18 ? "firstHalf" : "secondHalf";

    const bets = await pool.query(
        `SELECT * FROM roulette_bets WHERE round_id IS NULL`
    );

    const roundCount = bets.rowCount;
    const pula = bets.rows.reduce((s, b) => s + b.amount, 0);

    const r = await pool.query(
        `INSERT INTO roulette_rounds
      (result_number, result_color, result_parity, result_1to18, liczba_zakladow, pula)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id`,
        [result, color, parity, halfs, roundCount, pula]
    );

    await pool.query(`
        DELETE FROM roulette_rounds
        WHERE id NOT IN (
            SELECT id FROM roulette_rounds
            ORDER BY id DESC
            LIMIT 100
            )
    `);

    await pool.query(
        `UPDATE roulette_bets SET round_id=$1 WHERE round_id IS NULL`,
        [r.rows[0].id]
    );

    const history = await pool.query(
        `SELECT * FROM roulette_rounds ORDER BY id DESC LIMIT 5`
    );


    io.emit("rouletteSpun", {
        round: { result_number: result, result_color: color },
        history: history.rows.map(r => ({
            number: r.result_number,
            color: r.result_color,
            bets: r.liczba_zakladow
        })),
        currentBets: {
            red: 0,
            black: 0,
            green: 0,

            even: 0,
            odd: 0,

            firstHalf: 0,
            secondHalf: 0,

            numbersTotal: 0,

            dozen1: 0,
            dozen2: 0,
            dozen3: 0,

            column1: 0,
            column2: 0,
            column3: 0,

            total: 0
        }
    });

    setTimeout(async () => {
        await payoutRouletteBets(bets.rows, result, color);

        rouletteState.spinning = false;
        rouletteState.bettingClosed = false;
        spinInProgress = false;

        const players = await pool.query(`
        SELECT id_user as "playerId", nickname, saldo
        FROM users
        WHERE id_user IN (
            SELECT DISTINCT id_user FROM roulette_bets WHERE round_id = $1
        )
    `, [r.rows[0].id]);

        io.emit("playerUpdateFull", {
            lobbyId: null, // ruletka nie ma lobby
            players: players.rows
        });

        io.emit("rouletteStatus", {
            bettingClosed: false,
            spinning: false
        });
    }, 8000);
}


export function initRoulette(io: Server) {

    setInterval(async () => {
        const now = Date.now();
        const remaining = rouletteState.nextSpinAt - now;

        // 🔔 TIMER DLA FRONTU
        io.emit("rouletteTimer", {
            remainingMs: remaining,
            bettingClosed: rouletteState.bettingClosed
        });

        // zamykamy zakłady
        if (
            remaining <= CLOSE_BEFORE_SPIN &&
            !rouletteState.bettingClosed &&
            !rouletteState.spinning
        ) {
            rouletteState.bettingClosed = true;
            io.emit("rouletteStatus", { bettingClosed: true });
        }

        // 🎡 SPIN
        if (remaining <= 0 && !spinInProgress) {
            spinInProgress = true;
            rouletteState.spinning = true;

            io.emit("rouletteStatus", {
                bettingClosed: true,
                spinning: true
            });

            rouletteState.nextSpinAt = Date.now() + ROUND_TIME;

            // 🔥 WYWOŁUJEMY SPIN
            performSpin(io);
        }
    }, 1000);

    io.on("connection", (socket: Socket) => {

        type RouletteBetsState = {
            red: number;
            black: number;
            green: number;

            even: number;
            odd: number;

            firstHalf: number;
            secondHalf: number;

            numbersTotal: number;

            dozen1: number;
            dozen2: number;
            dozen3: number;

            column1: number;
            column2: number;
            column3: number;

            total: number;
        };


        // ------------------------------------------------------
    // Postaw zakład
    // ------------------------------------------------------
    initRouletteBets(socket, io);


    // ------------------------------------------------------
    // Pobranie pełnego stanu ruletki
    // ------------------------------------------------------
    socket.on("getRouletteState", async (cb) => {
        try {
            // 🟦 pobieramy nierozliczone zakłady
            const openBets = await pool.query(
            `SELECT * FROM roulette_bets WHERE round_id IS NULL`
            );

            // sumy do wysłania
            const currentBets: RouletteBetsState = {
                red:  openBets.rows
                    .filter(b => b.bet_type === "color" && b.bet_value === 1)
                    .reduce((s,b)=>s+b.amount,0),

                black: openBets.rows
                    .filter(b => b.bet_type === "color" && b.bet_value === 2)
                    .reduce((s,b)=>s+b.amount,0),

                green: openBets.rows
                    .filter(b => b.bet_type === "color" && b.bet_value === 0)
                    .reduce((s,b)=>s+b.amount,0),

                even: openBets.rows
                    .filter(b => b.bet_type === "parity" && b.bet_value === 1)
                    .reduce((s,b)=>s+b.amount,0),

                odd: openBets.rows
                    .filter(b => b.bet_type === "parity" && b.bet_value === 2)
                    .reduce((s,b)=>s+b.amount,0),

                firstHalf: openBets.rows
                    .filter(b => b.bet_type === "1to18" && b.bet_value === 1)
                    .reduce((s,b)=>s+b.amount,0),

                secondHalf: openBets.rows
                    .filter(b => b.bet_type === "1to18" && b.bet_value === 2)
                    .reduce((s,b)=>s+b.amount,0),

                numbersTotal: openBets.rows
                    .filter(b => b.bet_type === "number")
                    .reduce((s, b) => s + b.amount, 0),

                dozen1: openBets.rows
                    .filter(b => b.bet_type === "dozen" && b.bet_value === 1)
                    .reduce((s,b)=>s+b.amount,0),

                dozen2: openBets.rows
                    .filter(b => b.bet_type === "dozen" && b.bet_value === 2)
                    .reduce((s,b)=>s+b.amount,0),

                dozen3: openBets.rows
                    .filter(b => b.bet_type === "dozen" && b.bet_value === 3)
                    .reduce((s,b)=>s+b.amount,0),

                column1: openBets.rows
                    .filter(b => b.bet_type === "column" && b.bet_value === 1)
                    .reduce((s,b)=>s+b.amount,0),

                column2: openBets.rows
                    .filter(b => b.bet_type === "column" && b.bet_value === 2)
                    .reduce((s,b)=>s+b.amount,0),

                column3: openBets.rows
                    .filter(b => b.bet_type === "column" && b.bet_value === 3)
                    .reduce((s,b)=>s+b.amount,0),

                total: 0
            };

            const num = (x: any) => Number(x || 0);

            currentBets.red = num(currentBets.red);
            currentBets.black = num(currentBets.black);
            currentBets.green = num(currentBets.green);
            currentBets.even = num(currentBets.even);
            currentBets.odd = num(currentBets.odd);
            currentBets.firstHalf = num(currentBets.firstHalf);
            currentBets.secondHalf = num(currentBets.secondHalf);
            currentBets.numbersTotal = num(currentBets.numbersTotal);
            currentBets.dozen1 = num(currentBets.dozen1);
            currentBets.dozen2 = num(currentBets.dozen2);
            currentBets.dozen3 = num(currentBets.dozen3);
            currentBets.column1 = num(currentBets.column1);
            currentBets.column2 = num(currentBets.column2);
            currentBets.column3 = num(currentBets.column3);


            currentBets.total =
                currentBets.red +
                currentBets.black +
                currentBets.green +
                currentBets.even +
                currentBets.odd +
                currentBets.firstHalf +
                currentBets.secondHalf +
                currentBets.numbersTotal +
                currentBets.dozen1 +
                currentBets.dozen2 +
                currentBets.dozen3 +
                currentBets.column1 +
                currentBets.column2 +
                currentBets.column3;


            // 🟦 historia
            const history = await pool.query(
            `SELECT * FROM roulette_rounds ORDER BY id DESC LIMIT 5`
            );

            cb({
                ok: true,
                currentBets,
                history: history.rows.map(r => ({
                    number: r.result_number,
                    color: r.result_color,
                    bets: r.liczba_zakladow
                }))
            });
        } catch (e) {
            console.error(e);
            cb({ ok: false, error: "DB error" });
        }
    });
  });
}
