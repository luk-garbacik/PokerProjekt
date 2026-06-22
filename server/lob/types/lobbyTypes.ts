// server/lob/types/lobbyTypes.ts

/**
 * Payload przy dołączaniu do lobby.
 */
export type JoinPayload = {
    lobbyId: number;
    playerId: number;
    pin?: string;
};

/**
 * Payload przy opuszczaniu lobby.
 */
export type LeavePayload = {
    lobbyId: number;
    playerId: number;
};

/**
 * Metadane połączenia socketowego
 */
export type SocketMeta = {
    playerId?: number;
    lobbies: Set<number>;
};

/**
 * Typ reprezentujący pojedynczą kartę w talii.
 *
 * @property rank - Ranga karty (np. "2", "10", "J", "Q", "K", "A")
 * @property suit - Kolor karty (np. "♠", "♥", "♦", "♣")
 */
export type Card = {
    rank: string;
    suit: string
};

/* =========================
   👤 STAN GRACZA
   ========================= */

export type PlayerState = {
    playerId: number;
    nickname: string;
    saldo: number;
    bet: number;
    folded: boolean;
    allIn: boolean;
    lastAction: string;
    sittingOut: boolean;
    totalCommitted: number;
};

/* =========================
   🪙 PULE
   ========================= */

export type Pot = {
    id: number;
    amount: number;
    eligiblePlayerIds: number[];
};

/* =========================
   🎯 FAZY GRY
   ========================= */

export type GamePhase =
    | "waiting"
    | "preflop"
    | "flop"
    | "turn"
    | "river"
    | "showdown";

/* =========================
   🧠 STAN CAŁEJ GRY
   ========================= */
export type LobbyPlayer = {
    playerId: number;
    nickname: string;
    saldo: number;
    sittingOut: boolean;
};
export type GameState = {
    lobbyId: number;
    smallBlind: number;
    bigBlind: number;

    players: PlayerState[];

    deck: Card[];
    hands: Record<number, Card[]>;

    pots: Pot[];

    currentBet: number;
    currentTurn: number;
    dealerIndex: number;

    phase: GamePhase;
    communityCards: Card[];

    hasActed: Record<number, boolean>;

    endedByFold?: boolean;
    showdownResolved?: boolean;

    turnInterval?: NodeJS.Timeout | null;
    turnTimeLeft?: number;
};
