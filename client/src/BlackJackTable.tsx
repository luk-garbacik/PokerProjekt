//BlackJackTable.tsx

import { socket } from "./socket";
import { useState, useEffect } from "react";

import "./BlackJackMobile.css";

function PlayingCard({ value, suit }: { value: string; suit: string }) {
    const isRed = suit === "♥" || suit === "♦";

    return (
        <div
            className={`
        w-16 h-24 bg-white rounded-md flex items-center justify-center
        font-bold text-xl shadow-xl border border-gray-300
        ${isRed ? "text-red-600" : "text-black"}
      `}
        >
            {value}{suit}
        </div>
    );
}

function handValue(hand: any[]) {
    let sum = 0;
    let aces = 0;

    for (const c of hand) {
        if (["J","Q","K"].includes(c.value)) sum += 10;
        else if (c.value === "A") {
            sum += 11;
            aces++;
        } else sum += Number(c.value);
    }

    while (sum > 21 && aces--) sum -= 10;
    return sum;
}


export default function BlackJackTable({
                                           userId,
                                           nickname,
                                           saldo,
                                       }: {
    userId: number;
    nickname: string;
    saldo: number;
}) {
    const [state, setState] = useState<any | null>(null);
    const [bet, setBet] = useState(10);
    const [shuffling, setShuffling] = useState(false);
    const activeHand = state?.hands?.[state.activeHandIndex] ?? null;



    const start = () => {
        setShuffling(true);

        setTimeout(() => {
            socket.emit("bj:start", { userId, bet }, (res: any) => {
                setShuffling(false);
                if (res.ok) setState(res.state);
            });
        }, 800);
    };

    const resetGame = () => {
        socket.emit("bj:reset", { userId }, () => {
            setState(null);
        });
    };

    useEffect(() => {
        socket.on("bj:update", setState);
        socket.on("bj:final", setState);

        return () => {
            socket.off("bj:update");
            socket.off("bj:final");
        };
    }, []);

    return (
        <div className="flex flex-col items-center blackjack-mobile">

            {/* ================= NAGŁÓWEK ================= */}
            <div className="w-full max-w-5xl flex justify-between items-center mb-6 bg-black/50 p-4 rounded-2xl shadow-lg">

                <h2 className="text-3xl font-extrabold text-gray-200">
                    BlackJack
                </h2>

                <div className="flex gap-4 items-center">
                    <div className="bg-gray-800/70 px-4 py-2 rounded-full text-white">
                        Gracz: <span className="text-yellow-300">{nickname}</span>
                    </div>
                    <div className="bg-gray-800/70 px-4 py-2 rounded-full text-green-400 font-bold">
                        ${saldo}
                    </div>
                </div>
            </div>

            {/* ================= STÓŁ ================= */}
            <div
                className="relative rounded-3xl p-3 w-full max-w-[1000px] aspect-[16/9]"
                style={{ background: "linear-gradient(135deg, #8B4513, #A0522D, #251305ff)" }}
            >
                <div
                    className="w-full h-full rounded-3xl relative shadow-2xl"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at center, #065f46 0%, #023927 100%)",
                    }}
                >

                    {/* NAPIS */}
                    <div className="absolute inset-0 flex items-center justify-center text-white text-6xl font-extrabold opacity-20 select-none">
                        BLACKJACK
                    </div>
                    {shuffling && (
                        <div className="absolute inset-0 flex items-center justify-center z-40">
                            <div className="flex gap-2 animate-pulse">
                                <div className="w-16 h-24 bg-white rounded-md shadow-xl rotate-12" />
                                <div className="w-16 h-24 bg-white rounded-md shadow-xl -rotate-6" />
                                <div className="w-16 h-24 bg-white rounded-md shadow-xl rotate-6" />
                            </div>
                        </div>
                    )}

                    {state?.finished && (
                        <div className="absolute inset-0 flex items-center justify-center z-50">
                            <div
                                className={`
                                    px-10 py-6 rounded-2xl text-4xl font-extrabold
                                    animate-bounce shadow-2xl
                                    ${state.result === "win" ? "bg-green-600 text-white" :
                                                                state.result === "lose" ? "bg-red-600 text-white" :
                                                                    "bg-gray-500 text-white"}
                                  `}
                            >
                                {state.result === "win" && `WYGRANA +$${state.payout}`}
                                {state.result === "lose" && `PRZEGRANA -$${state.hands.reduce(
                                        (sum: number, h: any) => sum + h.bet, 0
                                )}`}

                                {state.result === "push" && `REMIS`}
                                {state.result === "blackjack" && `BLACKJACK +$${state.payout}`}
                            </div>
                        </div>
                    )}

                    {/* ================= DEALER ================= */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">

                        {state?.dealerHand && (
                            <div className="mt-2 px-4 py-1 bg-black/70 rounded-full text-white font-bold">
                                {state.dealerTurn || state.finished
                                    ? handValue(state.dealerHand)
                                    : handValue([state.dealerHand[0]])}
                            </div>
                        )}


                        <div className="text-gray-200 font-bold text-lg">Dealer</div>

                        <div className="flex gap-3">
                            {state?.dealerHand?.map((c: any, i: number) => {
                                const hidden = i === 1 && !state.dealerTurn && !state.finished;

                                return hidden ? (
                                    <div
                                        key={i}
                                        className="w-16 h-24 bg-gray-700 rounded-md shadow-xl border border-black"
                                    />
                                ) : (
                                    <PlayingCard key={i} value={c.value} suit={c.suit} />
                                );
                            })}
                        </div>
                    </div>

                    {/* ================= GRACZ ================= */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 items-end">

                        {state?.hands?.map((hand: any, handIndex: number) => {
                            const isActive = handIndex === state.activeHandIndex;

                            return (
                                <div
                                    key={handIndex}
                                    className={`
                    flex flex-col items-center gap-2
                    transition-all duration-300
                    ${isActive ? "scale-110" : "opacity-70"}
                `}
                                >
                                    {/* karty */}
                                    <div
                                        className={`
                        flex gap-3 p-2 rounded-xl
                        ${isActive ? "ring-4 ring-yellow-400 bg-black/30" : ""}
                    `}
                                    >
                                        {hand.cards.map((c: any, i: number) => (
                                            <PlayingCard key={i} value={c.value} suit={c.suit} />
                                        ))}
                                    </div>

                                    {/* suma */}
                                    <div className="px-4 py-1 bg-black/70 rounded-full text-yellow-300 font-bold">
                                        {handValue(hand.cards)}
                                    </div>

                                    {/* etykieta */}
                                    {state.hands.length > 1 && (
                                        <div className="text-sm text-gray-300">
                                            Ręka {handIndex + 1}
                                            {isActive && " (aktywna)"}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ================= PANEL DOLNY ================= */}
            <div className="w-full max-w-5xl mt-6 flex justify-center">
                <div className="bg-gray-800/70 p-4 rounded-xl flex gap-4 items-center">

                    {!state && (
                        <>
                            <input
                                type="number"
                                value={bet}
                                onChange={(e) => setBet(Number(e.target.value))}
                                className="w-28 p-2 rounded text-black"
                            />
                            <button
                                onClick={start}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                            >
                                Start
                            </button>
                        </>
                    )}

                    {activeHand && !state.finished && !state.dealerTurn && (
                            <>
                            <button
                                onClick={() => socket.emit("bj:hit", { userId })}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                Hit
                            </button>
                            <button
                                onClick={() => socket.emit("bj:stand", { userId })}
                                className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 transition"
                            >
                                Stand
                            </button>
                            {activeHand.cards.length === 2 &&
                                state.hands.length === 1 &&
                                activeHand.cards[0].value === activeHand.cards[1].value && (
                                <button
                                    onClick={() => socket.emit("bj:split", { userId })}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold"
                                >
                                    Split
                                </button>
                            )}

                        </>
                    )}

                    {state?.finished && (
                        <button
                            onClick={resetGame}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                        >
                            Nowa gra
                        </button>
                    )}


                </div>
            </div>

        </div>
    );
}
