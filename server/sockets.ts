
//poker-multiplayer/server/sockets.ts
import { Server, Socket } from "socket.io";
import { registerLobbyHandlers } from "./lob/lobbySockets.ts";

/**
 * Inicjalizuje obsługę Socket.IO na serwerze.
 * 
 * @param io - Instancja serwera Socket.IO
 */
export const initSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("Nowe połączenie:", socket.id);

    // Handlery lobby
    registerLobbyHandlers(io, socket);


  });
};

