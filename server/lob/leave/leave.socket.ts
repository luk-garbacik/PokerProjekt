// leave.socket.ts
import { leaveLobbyHandler } from "./leave.handler.ts";
import type { Socket, Server } from "socket.io";

export function registerLeaveLobby(io: Server, socket: Socket) {
    socket.on("leaveLobby", async (payload, ack) => {
        try {
            await leaveLobbyHandler(io, socket, payload);
            ack?.({ ok: true });
        } catch (err) {
            console.error("leaveLobby error:", err);
            ack?.({ ok: false, error: "Błąd serwera podczas leave" });
        }
    });
}
