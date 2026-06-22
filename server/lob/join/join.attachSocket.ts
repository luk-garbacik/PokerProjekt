//server/lob/join/join.attachSocket.ts
import { Socket } from "socket.io";
import { socketMeta } from "../infra/socketMeta.ts";
import { registerPlayerSocket } from "../infra/socketRegistry.ts";

export function joinAttachSocket(
    socket: Socket,
    lobbyId: number,
    playerId: number
) {
    const meta = socketMeta.get(socket.id)!;

    socket.join(`lobby_${lobbyId}`);
    socket.join(`player_${playerId}`);

    meta.playerId = playerId;
    meta.lobbies.add(lobbyId);
    registerPlayerSocket(playerId, socket);
}
