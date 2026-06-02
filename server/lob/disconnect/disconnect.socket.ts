// disconnect.socket.ts
import type { Server, Socket } from "socket.io";
import { disconnectHandler } from "./disconnect.handler.ts";

export function registerDisconnect(io: Server, socket: Socket) {
    socket.on("disconnect", async () => {
        try {
            await disconnectHandler(io, socket);
        } catch (err) {
            console.error("disconnect error:", err);
        }
    });
}
