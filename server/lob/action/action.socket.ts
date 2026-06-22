// lob/action/action.socket.ts
import type { Server, Socket } from "socket.io";
import { handleMakeAction } from "./action.handler.ts";

export function registerActionSocket(io: Server, socket: Socket) {
    socket.on("makeAction", async (payload) => {
        await handleMakeAction(io, socket, payload);
    });
}
