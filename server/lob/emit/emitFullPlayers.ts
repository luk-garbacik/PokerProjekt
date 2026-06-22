//server/lob/emit/emitFullPlayers.ts

import type { Server } from "socket.io";
import { fetchLobbyPlayers } from "../repositories/lobby.repository.ts";

/**
 * Wysyła do wszystkich klientów w danym lobby pełną listę graczy.
 */
export async function emitFullPlayers(
    io: Server,
    lobbyId: number
) {
    const players = await fetchLobbyPlayers(lobbyId);
    io.to(`lobby_${lobbyId}`).emit("playerUpdateFull", {
        lobbyId,
        players
    });
}
