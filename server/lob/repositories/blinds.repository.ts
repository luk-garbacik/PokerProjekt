import { pool } from "../../db/db.ts";
import type { GameState } from "../types/lobbyTypes.ts";
import { persistBlinds } from "../game/blinds/persistBlinds.ts";

export async function persistBlindsTransaction(state: GameState) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        await persistBlinds({client: client, state: state});
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}
