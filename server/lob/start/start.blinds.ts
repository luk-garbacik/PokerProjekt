// start/start.blinds.ts
import { postBlinds } from "../game/blinds/postBlinds.ts";
import { emitFullPlayers } from "../emit/emitFullPlayers.ts";
import { emitPots } from "../emit/emitPots.ts";
import { persistBlinds } from "../game/blinds/persistBlinds.ts";

export async function applyBlindsIfPossible(client, io, state) {
    const activeCount = state.players.filter(p => !p.sittingOut).length;
    if (activeCount < 2) return;

    // 🧠 1. Modyfikacja IN-MEMORY
    postBlinds(state, state.smallBlind, state.bigBlind);

    // 🧠 2. Zapis DIFF do DB
    await client.query("BEGIN");
    try {
        await persistBlinds({client: client, state: state});
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    }

    // 📡 3. Emit po COMMIT
    emitPots(io, state.lobbyId, state);
    await emitFullPlayers(io, state.lobbyId);
}

