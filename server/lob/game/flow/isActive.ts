//server/lob/game/flow/isActive.ts
import type {PlayerState} from "../../types/lobbyTypes.ts";

export function isInHand(p: PlayerState): boolean {
    return !p.folded && !p.sittingOut;
}
