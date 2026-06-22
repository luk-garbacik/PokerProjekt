import type { Server, Socket } from "socket.io";
import type { JoinPayload } from "../types/lobbyTypes.ts";
import { handleJoinLobby } from "./join.handler.ts";

export function registerJoinSocket(io: Server, socket: Socket) {
    socket.on("joinLobbyPoker", async (payload: JoinPayload, ack) => {
        try {
            await handleJoinLobby(io, socket, payload, ack);
        } catch (err) {
            console.error("joinLobbyPoker error:", err);
            ack?.({ ok: false, error: "Błąd serwera" });
        }
    });
}
