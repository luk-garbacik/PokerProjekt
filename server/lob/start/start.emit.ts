// start/start.emit.ts
import { emitPots } from "../emit/emitPots.ts";
import {emitTurn} from "../emit/emitTurn.ts";

export function emitStartGame(io, lobbyId, state) {
    // prywatne karty
    state.players
        .filter(p => !p.sittingOut)
        .forEach(p => {
            io.to(`player_${p.playerId}`).emit("dealCards", {
                playerId: p.playerId,
                cards: state.hands[p.playerId],
            });
        });

    emitPots(io, lobbyId, state);

    io.to(`lobby_${lobbyId}`).emit("playerUpdateBets", {
        players: state.players
    });

    emitTurn(io, lobbyId, state);

}
