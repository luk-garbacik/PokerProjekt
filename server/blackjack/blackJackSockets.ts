//BlackJackSockets.ts

import { Server, Socket } from "socket.io";
import { pool } from "../db/db.ts";
import { createDeck, handValue } from "./blackJackLogic.ts";
import type {BJHand,BJState ,Card } from "./blackJackTypes.ts";
import { applyBlackJackPayout } from "./blackJackPayout.ts";
import { applyBlackJackBet } from "./blackJackBet.ts";

const games = new Map<number, BJState>();
const BJ_BLACKJACK_PAYOUT = 2.5;
const BJ_WIN_PAYOUT = 2;

export function initBlackJack(io: Server) {
    io.on("connection", (socket: Socket) => {

        socket.on("bj:start", async ({ userId, bet }, cb) => {
            console.log("[BJ][START] payload", { userId, bet });

            const realUserId = socket.data.userId ?? userId;
            console.log("[BJ][START] resolved userId", {
                socketDataUserId: socket.data.userId,
                payloadUserId: userId,
                realUserId
            });
            const ok = await applyBlackJackBet(realUserId, bet);
            if (!ok) {
                cb({
                    ok: false,
                    error: "BRAK_SRODKOW"
                });
                return;
            }

            await emitSaldo(socket, realUserId);

            const deck = createDeck();

            const state: BJState = {
                userId: realUserId,
                deck,
                dealerHand: [deck.pop()!, deck.pop()!],

                hands: [{
                    cards: [deck.pop()!, deck.pop()!],
                    bet,
                    finished: false
                }],
                activeHandIndex: 0,

                finished: false
            };

            // BLACKJACK CHECK
            if (handValue(state.hands[0].cards) === 21) {
                state.finished = true;
                state.result = "blackjack";
                state.payout = bet * BJ_BLACKJACK_PAYOUT;

                socket.emit("bj:final", { ...state });

                await applyBlackJackPayout(realUserId, state.payout);
                await emitSaldo(socket, realUserId);

                cb({ ok: true, state });
                return;
            }


            games.set(realUserId, state);
            logState("START:init", state);

            cb({ ok: true, state });
        });


        socket.on("bj:hit", async ({ userId }, cb) => {
            const realUserId = socket.data.userId ?? userId;
            const game = games.get(realUserId);
            logState("HIT:before", game);
            if (game.dealerTurn) {
                console.warn("[BJ] action blocked – dealer turn");
                return;
            }

            if (!game || game.finished) return;

            const hand = game.hands[game.activeHandIndex];
            if (!hand || hand.finished){
                console.warn("[BJ][HIT] invalid hand", {
                    activeHandIndex: game.activeHandIndex
                });
                return;
            }

            hand.cards.push(game.deck.pop()!);

            if (handValue(hand.cards) > 21) {
                hand.finished = true;
                game.activeHandIndex++;
                console.warn("[BJ][HIT] last hand → dealer phase", {
                    activeHandIndex: game.activeHandIndex,
                    handsLength: game.hands.length
                });

                console.warn("[BJ][HIT] BUST → next hand");

                // ⬇⬇⬇ TO JEST KLUCZ ⬇⬇⬇
                if (game.activeHandIndex >= game.hands.length) {
                    game.dealerTurn = true;
                    await runDealer(game, socket);
                    return;
                }

            }

            logState("HIT:after", game);

            socket.emit("bj:update", { ...game });
        });

        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        socket.on("bj:stand", async ({ userId }, cb) => {
            const realUserId = socket.data.userId ?? userId;
            const game = games.get(realUserId);
            logState("STAND:before", game);

            if (!game || game.finished) return;
            if (game.dealerTurn) return;

            const hand = game.hands[game.activeHandIndex];
            if (!hand || hand.finished) return;

            hand.finished = true;
            game.activeHandIndex++;

            logState("STAND:after-hand", game);

            if (game.activeHandIndex >= game.hands.length) {
                game.dealerTurn = true;
                await runDealer(game, socket);
                return;
            }

            socket.emit("bj:update", { ...game });
        });



        socket.on("bj:reset", ({ userId }, cb) => {
            const realUserId = socket.data.userId ?? userId;
            games.delete(realUserId);
            cb({ ok: true });
        });

        socket.on("bj:split",async  ({ userId }, cb) => {
            const realUserId = socket.data.userId ?? userId;
            const game = games.get(realUserId);
            logState("SPLIT:before", game);

            if (!game) return;

            const hand = game.hands[game.activeHandIndex];
            if (!hand) {
                console.error("[BJ][SPLIT] hand undefined");
                return;
            }

            const [c1, c2] = hand.cards;

            if (c1.value !== c2.value) return;

            const ok = await applyBlackJackBet(realUserId, hand.bet);
            if (!ok) {
                cb?.({ ok: false, error: "BRAK_SRODKOW_NA_SPLIT" });
                return;
            }
            await emitSaldo(socket, realUserId);



            game.hands.splice(
                game.activeHandIndex,
                1,
                { cards: [c1, game.deck.pop()!], bet: hand.bet, finished: false },
                { cards: [c2, game.deck.pop()!], bet: hand.bet, finished: false }
            );

            game.activeHandIndex = 0;

            logState("SPLIT:after", game);
            socket.emit("bj:update", { ...game });
        });



    });
}

async function runDealer(game: BJState, socket: Socket) {

    socket.emit("bj:update", { ...game });

    while (handValue(game.dealerHand) < 17) {
        await new Promise(r => setTimeout(r, 600));

        game.dealerHand.push(game.deck.pop()!);

        console.warn("[BJ][DEALER] HIT", handValue(game.dealerHand));
        socket.emit("bj:update", { ...game }); // ✅ JEDYNY SPOSÓB
    }

    const dealer = handValue(game.dealerHand);

    game.finished = true;
    game.payout = 0;

    for (const h of game.hands) {
        const player = handValue(h.cards);
        if (player > 21) continue;
        if (dealer > 21 || player > dealer) game.payout += h.bet * BJ_WIN_PAYOUT;
        else if (player === dealer) game.payout += h.bet;
    }

    const totalBet = game.hands.reduce((s, h) => s + h.bet, 0);

    if (game.payout === 0) game.result = "lose";
    else if (game.payout === totalBet) game.result = "push";
    else game.result = "win";
    game.dealerTurn = false;

    const userId = game.userId;

    await applyBlackJackPayout(userId, game.payout);

    await emitSaldo(socket, userId);

    socket.emit("bj:final", { ...game });

    games.delete(userId);

}



function logState(tag: string, game?: BJState) {
    if (!game) {
        console.log(`[BJ][${tag}] game = undefined`);
        return;
    }

    console.log(`[BJ][${tag}]`, {
        handsLength: game.hands?.length,
        activeHandIndex: game.activeHandIndex,
        activeHandExists: !!game.hands?.[game.activeHandIndex],
        handsFinished: game.hands?.map((h, i) => ({
            i,
            finished: h.finished,
            cards: h.cards.map(c => c.value + c.suit)
        }))
    });
}
export async function emitSaldo(socket: Socket, userId: number) {
    console.log("[emitSaldo] called", {
        userId,
        socketId: socket.id
    });

    if (!userId) {
        console.error("[emitSaldo] ❌ userId is undefined/null", {
            socketDataUserId: socket.data.userId,
            handshakeUserId: socket.handshake.auth?.userId
        });
        return;
    }

    const { rows } = await pool.query(
        "SELECT saldo FROM users WHERE id_user = $1",
        [userId]
    );

    console.log("[emitSaldo] DB result", {
        userId,
        rowsLength: rows.length,
        rows
    });

    if (!rows.length) {
        console.error("[emitSaldo] ❌ NO USER IN DB", {
            userId
        });
        return;
    }

    socket.emit("user:saldoUpdate", {
        userId,
        saldo: rows[0].saldo
    });
}

