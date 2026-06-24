import type { Server, Socket } from "socket.io";
import type { JoinPayload } from "../types/lobbyTypes.ts";
import { socketMeta } from "../infra/socketMeta.ts";
import { pool } from "../../db/db.ts";

import { joinLobbyTransaction } from "./join.transaction.ts";
import { joinAttachSocket } from "./join.attachSocket.ts";
import { emitJoinSnapshot } from "./join.emitSnapshot.ts";
import { handleJoinDuringIdleGame } from "./join.tryResumeGame.ts";

import { getIO } from "../../socketInstance.ts";

export async function handleJoinLobby(
    io: Server,
    socket: Socket,
    payload: JoinPayload,
    ack?: (res: any) => void
) {
    const { lobbyId, playerId, pin } = payload;

    const meta = socketMeta.get(socket.id)!;
    if (meta.lobbies.has(lobbyId)) {
        return ack?.({ ok: false, error: "Już w lobby" });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await joinLobbyTransaction(
            client,
            lobbyId,
            playerId,
            pin
        );

        if (!result.ok) {
            await client.query("ROLLBACK");
            return ack?.(result);
        }

        await client.query("COMMIT");

        joinAttachSocket(socket, lobbyId, playerId);
        getIO().emit("adminLobbyUpdated");
        const snapshot = await emitJoinSnapshot(io, socket, lobbyId);

        ack?.({ ok: true, ...snapshot });

        await handleJoinDuringIdleGame(io, lobbyId);

    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("joinLobby error:", err);
        ack?.({ ok: false, error: "Błąd serwera" });
    } finally {
        client.release();
    }
}