// start/start.socket.ts
import type { Server, Socket } from "socket.io";
import { startGameHandler } from "./start.handler.ts";

import { playerReadyHandler } from "./playerReady.handler.ts";

export function registerStartGame(io: Server, socket: Socket) {
//     socket.on("startGame", async ({ lobbyId }) => {
//         await startGameHandler(io, socket, lobbyId);
//     });
    socket.on("startGame", async ({ lobbyId }) => {
            await playerReadyHandler(io, socket, lobbyId);
        });
}
