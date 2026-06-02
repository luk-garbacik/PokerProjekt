//server/lob/join/join.tryResumeGame.ts
import { pool } from "../../db/db.ts";
import { resetGame} from "../game/flow/resetGame.ts";
import {emitTurn} from "../emit/emitTurn.ts";
import type { Server } from "socket.io";
import { gameStates } from "../game/gameState/gameState.ts";
import {emitNewRound} from "../emit/emitNewRound.ts";
import {emitDealCards} from "../emit/emitDealCards.ts";
import {startTurnTimer} from "../game/flow/turnTimer.ts";
import {applyGameAction} from "../action/action.apply.ts";

export async function handleJoinDuringIdleGame(
    io: Server,
    lobbyId: number
) {
    const state = gameStates.get(lobbyId);
    if (!state) return;

    if (state.phase !== "waiting" && state.phase !== "showdown") return;

    const res = await pool.query(
        `SELECT pl.player_id, u.nickname, u.saldo
     FROM player_lobby pl
     JOIN users u ON u.id_user = pl.player_id
     WHERE pl.lobby_id = $1
     ORDER BY pl.joined_at ASC`,
        [lobbyId]
    );

    const players = res.rows.map((r: any) => ({
        playerId: r.player_id,
        nickname: r.nickname,
        saldo: r.saldo,
        sittingOut:
            state.phase !== "waiting" ? true : r.saldo <= 0
    }));

    if (players.filter(p => !p.sittingOut).length < 2) return;

    resetGame(state, players);
    if (state.phase === "waiting") return;

    io.to(`lobby_${lobbyId}`).emit("gameStarted", { lobbyId });

    emitNewRound(io, lobbyId, state);

    for (const p of state.players.filter(p => !p.sittingOut)) {
        emitDealCards(io,lobbyId,state);
    }

    emitTurn(io, lobbyId, state);
// 🔥 START TIMERA DLA PIERWSZEJ TURY
    startTurnTimer(
        state,
        (playerId, timeLeft) => {
            io.to(`lobby_${lobbyId}`).emit("turnTimerUpdate", {
                playerId,
                timeLeft
            });
        },
        async (timeoutPlayerId) => {
            const current = state.players[state.currentTurn];
            if (!current || current.playerId !== timeoutPlayerId) return;

            if (state.turnInterval) {
                clearInterval(state.turnInterval);
                state.turnInterval = null;
            }

            await applyGameAction(io, lobbyId, timeoutPlayerId, "fold");
        }
    );
}
