//  server/lob/lobbySockets.ts

import type { Server, Socket } from "socket.io";
import { socketMeta } from "./infra/socketMeta.ts";
import { registerJoinSocket } from "./join/join.socket.ts";
import { registerLeaveLobby } from "./leave/leave.socket.ts";
import { registerDisconnect } from "./disconnect/disconnect.socket.ts";
import { registerStartGame } from "./start/start.socket.ts";
import { registerActionSocket } from "./action/action.socket.ts";

/**
 * Rejestruje handlery socketowe związane z lobby pokerowym.
 */
export function registerLobbyHandlers(io: Server, socket: Socket) {
  console.log("Gracz połączony:", socket.id);
  socketMeta.set(socket.id, { lobbies: new Set<number>() });

  // -------------------- joinLobby --------------------
  registerJoinSocket(io, socket);


  // -------------------- leaveLobby --------------------
  registerLeaveLobby(io, socket);

  // -------------------- disconnect --------------------
  registerDisconnect(io, socket);

  // -------------------- startGame --------------------
  registerStartGame(io, socket);

  // -------------------- makeAction --------------------
  registerActionSocket(io, socket);
}

