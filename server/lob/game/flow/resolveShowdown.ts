// server/lob/game/flow/resolveShowdown.ts
import type { Server } from "socket.io";
import type { GameState } from "../../types/lobbyTypes.ts";

import {resolveShowdownLogic} from "../showdown/showdown.logic.ts";
import {persistShowdownPayouts} from "../showdown/showdown.repository.ts";

import { emitPots } from "../../emit/emitPots.ts";
import { emitFullPlayers } from "../../emit/emitFullPlayers.ts";
import { emitPlayerUpdateBets } from "../../emit/emitUpdateBets.ts";
import { emitPotWinner } from "../../emit/emitPotWinner.ts";
import { emitShowdownHands } from "../../emit/emitShadownHands.ts";

export async function resolveShowdown(
    io: Server,
    lobbyId: number,
    state: GameState
) {
    console.log("🃏 SHOWDOWN");

    const payouts = resolveShowdownLogic(state);

    emitPots(io, lobbyId, state);

    if (!state.endedByFold) {
        emitShowdownHands(io, lobbyId, state);
    }

    for (const payout of payouts) {
        emitPotWinner(io, lobbyId, state, payout);
    }

    await persistShowdownPayouts(payouts);

    await emitFullPlayers(io, lobbyId);

    emitPlayerUpdateBets(io, lobbyId, state);

    state.pots = [];
    emitPots(io, lobbyId, state);

    console.log("🏁 SHOWDOWN_END");
}
