import { readyPlayers } from "../game/gameState/readyPlayers.ts";
import { gameStates } from "../game/gameState/gameState.ts";
import { socketMeta } from "../infra/socketMeta.ts";
import { startGameHandler } from "./start.handler.ts";
import { fetchLobbyPlayers } from "../repositories/lobby.repository.ts";

const startTimers = new Map<number, NodeJS.Timeout>();

export async function playerReadyHandler(
    io: any,
    socket: any,
    lobbyId: number
) {
    const meta = socketMeta.get(socket.id);
    if (!meta?.playerId) {
        return;
    }

    let ready = readyPlayers.get(lobbyId);

    if (!ready) {
        ready = new Set<number>();
        readyPlayers.set(lobbyId, ready);
    }

    ready.add(meta.playerId);

    console.log("\n=== PLAYER READY ===");
    console.log("Lobby:", lobbyId);
    console.log("Player:", meta.playerId);

    const players = await fetchLobbyPlayers(lobbyId);

    console.log("Players:");

    players.forEach(player => {
        console.log(
            players.map(player => ({
                    id: player.playerId,
                    nickname: player.nickname,
                    ready: ready.has(player.playerId)
                }))
        );
    });

    console.log("====================\n");

    const state = gameStates.get(lobbyId);

    if ( state && state.phase !== "waiting") {
        return;
    }

    if (ready.size >= 2) {

        if (startTimers.has(lobbyId)) {
            return;
        }

        console.log(`⏳ Start gry lobby ${lobbyId} za 5 sekund`);

        let seconds = 5;

        io.to(`lobby_${lobbyId}`).emit("gameStarting", {
            seconds
        });

        const countdown = setInterval(() => {

            seconds--;

            io.to(`lobby_${lobbyId}`).emit("gameStarting", {
                seconds
            });

            console.log(`🎴 Lobby ${lobbyId} start za ${seconds}s`);

            if (seconds <= 0) {
                clearInterval(countdown);
            }

        }, 1000);

        const timer = setTimeout(async () => {
            startTimers.delete(lobbyId);

            const currentReady = readyPlayers.get(lobbyId);

            if (!currentReady || currentReady.size < 2) {
                return;
            }

            const state = gameStates.get(lobbyId);

            if (state && state.phase !== "waiting") {
                return;
            }

            await startGameHandler(io, socket, lobbyId);

        }, 5000);

        startTimers.set(lobbyId, timer);
    }
}
