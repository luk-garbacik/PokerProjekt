//BlackJackTypes.tsx
export type Card = {
    suit: "♠" | "♥" | "♦" | "♣";
    value: string;
};

export type BJHand = {
    cards: Card[];
    bet: number;
    finished: boolean;
};

export type BJState = {
    userId: number;
    deck: Card[];
    dealerHand: Card[];

    hands: BJHand[];
    activeHandIndex: number;
    dealerTurn?: boolean;
    finished: boolean;
    result?: "win" | "lose" | "push" | "blackjack";
    payout?: number;
};



