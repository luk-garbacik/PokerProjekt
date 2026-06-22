// client/PokerTable.tsx

import React, { useEffect, useState } from "react";
import { socket } from "./socket";
import styles from "./PokerTable.module.css";

import "./PokerMobile.css";
/**
 * Typ reprezentujący pojedynczego gracza.
 */
type Player = { 
  /** Unikalne ID gracza */
  playerId: number;
  /** Wyświetlana nazwa gracza */
  nickname: string;
  /** Aktualne saldo (żetony/pieniądze) */
  saldo: number;
  /** Aktualna kwota obstawiona w danej rundzie */
  bet?: number;
  /** Czy gracz spasował */
  folded?: boolean;
  /** Czy gracz przeszedł na ALL-IN */
  allIn?: boolean;
  /** Ostania akcja gracza*/
  lastAction?: string;
};

/**
 * Właściwości komponentu PokerTable.
 */
type Props = {
  /** ID lobby (stołu pokerowego) */
  lobbyId: number;
  /** Maksymalna liczba graczy przy stole */
  maxPlayers: number;
  /** Wysokość small blinda */
  smallBlind: number;
  /** Wysokość big blinda */
  bigBlind: number;
  /** ID bieżącego użytkownika */
  userId: number;
  /** Nick bieżącego użytkownika */
  nickname: string;
  /** Startowe saldo gracza */
  saldo: number;
  /** Początkowa lista graczy */
  initialPlayers: Player[];
  /** Funkcja wywoływana przy opuszczeniu stołu */
  onLeave: () => void;
};

/**
 * Typ pojedynczej karty (do gry Texas Hold'em).
 */
type Card = { 
  /** Figura lub liczba (np. A, K, Q, J, 10, 2-9) */
  rank: string; 
  /** Kolor karty (np. ♥, ♦, ♣, ♠) */
  suit: string 
};

/**
 * Komponent główny odpowiadający za renderowanie stołu pokerowego
 * oraz obsługę interakcji gracza w lobby.
 * 
 * Obsługuje:
 * - prywatne karty gracza
 * - karty wspólne (flop, turn, river)
 * - aktualizacje graczy (saldo, bet, fold, all-in)
 * - kolejność tur
 * - wysyłanie akcji (fold, check, call, raise, all-in)
 * 
 * @component
 */
export default function PokerTable({
  lobbyId,
  maxPlayers,
  smallBlind,
  bigBlind,
  userId,
  nickname,
  saldo,
  initialPlayers, 
  onLeave,
}: Props) {
  /** Gracze przy stole */
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: maxPlayers }, (_, i) => initialPlayers[i] || { playerId: 0, nickname: "", saldo: 0 })
  );

  /** Prywatne karty użytkownika */
  const [hand, setHand] = useState<Card[]>([]);
  /** Aktualna runda gry */
  const [round, setRound] = useState<"preflop" | "flop" | "turn" | "river" | "showdown">("preflop");
  /** Karty wspólne na stole */
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  /** Pula gry */
  type UIPot = {
    index: number;
    amount: number;
    eligiblePlayerIds: number[];
  };

  const [pots, setPots] = useState<UIPot[]>([]);
  const [totalPot, setTotalPot] = useState(0);

  /** Czy gra się rozpoczęła */
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  /** ID gracza, którego jest tura */
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<number | null>(null);
  /** Czas na ruch*/
  const [turnTimer, setTurnTimer] = useState<number | null>(null);
  /** Czas do startu*/
  const [gameStartingIn, setGameStartingIn] = useState<number | null>(null);
  /** Kwota raise ustawiana w inpucie */
  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  /** Prywatne lub ujawnione karty graczy (pokazywane przy showdown) */
  const [revealedHands, setRevealedHands] = useState<Record<number, Card[]>>({});


  /** Animacja tasowania kart */
  const [deckAnimation, setDeckAnimation] = useState<"idle" | "shuffling" | "dealing">("idle");

  // AnimacjA zwycięzcy
  const [potWinnerAnimation, setPotWinnerAnimation] = useState<{
    potIndex: number;
    winnerNicknames: string[];
    amount: number;
  } | null>(null);

  /**
   * Odbiera prywatne karty użytkownika z serwera.
   */
  useEffect(() => {
    const handler = ({ playerId, cards }: { playerId: number; cards: Card[] }) => {
      if (playerId === userId) {
        // Ukryj karty przed animacją
        setHand([]);

        setDeckAnimation("shuffling"); // start tasowania

        setTimeout(() => {
          setDeckAnimation("dealing"); // przechodzimy do rozdawania
        }, 1500); // 1.5s tasowania

        setTimeout(() => {
          setHand(cards); // rozdanie kart
          setDeckAnimation("idle"); // zakończenie animacji
        }, 2500); // 2.5s rozdania po tasowaniu
      }
    };
    socket.on("dealCards", handler);
    return () => {
      socket.off("dealCards", handler);
    };
  }, [userId]);

  /**
   * Odbiera aktualizacje dotyczące listy graczy i ich stawek.
   */
  useEffect(() => {
    const handler = (data: { lobbyId: number; players: Player[] }) => {
      if (data.lobbyId !== lobbyId) return;

      setPlayers(() => {
        const slots: Player[] = Array.from(
            { length: maxPlayers },
            () => ({ playerId: 0, nickname: "", saldo: 0 })
        );

        data.players.forEach((p, i) => {
          if (i < maxPlayers) {
            slots[i] = p;
          }
        });

        return slots;
      });
    };
    socket.on("playerUpdateFull", handler);
    return () => {
      socket.off("playerUpdateFull", handler);
    };
  }, [lobbyId, maxPlayers]);

  /**
   * Odbiera informacje o kartach wspólnych, puli i starcie gry.
   */
  useEffect(() => {
    const communityHandler = ({ cards }: { cards: Card[] }) => setCommunityCards(cards);
    const handler = ({ pots, total }: { pots: UIPot[]; total: number }) => {
      setPots(pots);
      setTotalPot(total);
    };
    const gameStartHandler = ({ lobbyId: gid }: { lobbyId: number }) => {
      if (gid === lobbyId) {
        setGameStarted(true);
        setGameStartingIn(null);
      }
    };

    socket.on("communityCards", communityHandler);
    socket.on("potsUpdate", handler);
    socket.on("gameStarted", gameStartHandler);

    return () => {
      socket.off("communityCards", communityHandler);
      socket.off("potsUpdate", handler);
      socket.off("gameStarted", gameStartHandler);
    };
  }, [lobbyId]);


  useEffect(() => {
  const phaseHandler = ({ phase, communityCards }: { phase: string; communityCards: Card[] }) => {
    setRound(phase as any);
    setCommunityCards(communityCards);
  };

  socket.on("phaseUpdate", phaseHandler);
  return () => {
    socket.off("phaseUpdate", phaseHandler);
  };
}, []);


  useEffect(() => {
  const handler = ({ players }: { players: { playerId: number; cards: Card[] }[] }) => {
    const newHands: Record<number, Card[]> = {};
    players.forEach(p => {
      newHands[p.playerId] = p.cards;
    });
    setRevealedHands(newHands);
  };

  socket.on("showdownHands", handler);
  return () => {
    socket.off("showdownHands", handler);
  };
}, []);



  /**
   * Odbiera aktualizacje zakładów, zmianę tury i przejście do następnej rundy (flop/turn/river).
   */
  useEffect(() => {
    const betsHandler = (data: { players: Player[] }) => {
      setPlayers(prev =>
        prev.map(p => {
          const upd = data.players.find((x: any) => x.playerId === p.playerId);
          return upd ? { ...p, saldo: upd.saldo, bet: upd.bet, folded: upd.folded, allIn: upd.allIn, lastAction: upd.lastAction  } : p;
        })
      );
    };

    const turnHandler = ({ playerId }: { playerId: number }) => setCurrentTurnPlayerId(playerId);

    const roundCompleteHandler = ({ lobbyId: gid }: { lobbyId: number }) => {
      if (gid !== lobbyId) return;
    };



    socket.on("playerUpdateBets", betsHandler);
    socket.on("turnUpdate", turnHandler);
    socket.on("bettingRoundComplete", roundCompleteHandler);

    return () => {
      socket.off("playerUpdateBets", betsHandler);
      socket.off("turnUpdate", turnHandler);
      socket.off("bettingRoundComplete", roundCompleteHandler);
    };
  }, [lobbyId]);

  useEffect(() => {
    const handler = ({ playerId, timeLeft }: { playerId: number; timeLeft: number }) => {

      // Jeśli zmieniła się tura – resetujemy licznik
      if (playerId === null || timeLeft === null) {
        setTurnTimer(null);
        return;
      }

      if (playerId !== currentTurnPlayerId) {
        setTurnTimer(null);
        return;
      }

      setTurnTimer(timeLeft);
    };

    socket.on("turnTimerUpdate", handler);

    return () => {
      socket.off("turnTimerUpdate", handler);
    };
  }, [currentTurnPlayerId]);

useEffect(() => {
  const handler = ({
    lobbyId: gid,
    communityCards,
    players
  }: {
    lobbyId: number;
    communityCards: Card[];
    players: Player[];
  }) => {
    if (gid !== lobbyId) return;

    setCommunityCards([]);
    setRound("preflop");
    setRevealedHands({});
    setPots([]);
    setTotalPot(0);

    setPlayers(prev => {
      const newPlayers: Player[] = [...prev];
      players.forEach(p => {
        const idx = newPlayers.findIndex(slot => slot.playerId === p.playerId);
        if (idx !== -1) {
          newPlayers[idx] = { ...newPlayers[idx], ...p, bet: p.bet, folded: false, allIn: false };
        }
      });
      return newPlayers;
    });

    // Pierwsza tura nowej rundy
    setCurrentTurnPlayerId(players.length > 0 ? players[0].playerId : null);
  };

  socket.on("newRound", handler);
    return () => {
      socket.off("newRound", handler);
    };
  }, [lobbyId]);

  useEffect(() => {
    const handler = ({ potIndex, winnerNicknames, amount }: { potIndex: number; winnerNicknames: string[]; amount: number }) => {
      setPotWinnerAnimation({ potIndex, winnerNicknames, amount });
      setTimeout(() => setPotWinnerAnimation(null), 5000);
    };

    socket.on("potWinner", handler);

    // Cleanup w formie funkcji void
    return () => {
      socket.off("potWinner", handler);
    };
  }, []);

  useEffect(() => {
    const handler = ({ seconds }: { seconds: number }) => {

      if (seconds <= 0) {
        setGameStartingIn(null);
        return;
      }

      setGameStartingIn(seconds);
    };

    socket.on("gameStarting", handler);

    return () => {
      socket.off("gameStarting", handler);
    };
  }, []);

  const isMobile = window.innerWidth <= 768;

  const tableWidth = isMobile ? 320 : 700;
  const tableHeight = isMobile ? 420 : 350;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-6 poker-mobile">
      {/* Nagłówek */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-6 bg-black/50 backdrop-blur-md p-4 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-extrabold text-gray-200 drop-shadow-lg mb-2 md:mb-0">
          PokerLobby #{lobbyId}
        </h2>
        {gameStartingIn !== null && (
          <div className="mt-2 text-center">
            <div className="bg-green-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg animate-pulse">
              🎴 Gra rozpocznie się za {gameStartingIn}s
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-3 items-center md:items-stretch">
          <div className="text-white font-semibold bg-gray-800/70 px-4 py-2 rounded-full shadow-md flex items-center">
            Gracze: {players.filter(p => p.playerId !== 0).length} / {maxPlayers}
          </div>

          <div className="text-sm text-gray-100 bg-black/50 px-4 py-1 rounded-full shadow-md flex items-center">
            SB: ${smallBlind} | BB: ${bigBlind}
          </div>

          <button
            onClick={() => socket.emit("startGame", { lobbyId })}
            className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 font-bold shadow-xl transition duration-300 hover:scale-105"
          >
            Gotowość
          </button>

          <button
            onClick={onLeave}
            className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 font-bold shadow-xl transition duration-300 hover:scale-105"
          >
            Opuść stół
          </button>
        </div>
      </div>

      {/* Stół */}
      <div className="relative rounded-3xl p-3 m-10 w-full max-w-[1000px] aspect-[16/9]" 
           style={{ background: "linear-gradient(135deg, #8B4513, #A0522D, #251305ff)" }}>
        
        <div className="w-full h-full rounded-3xl flex items-center justify-center shadow-2xl relative"
             style={{ backgroundImage: "radial-gradient(circle at center, #065f46 0%, #023927 100%)" }}>

            {/* Animacja talii kart */}
            {deckAnimation !== "idle" && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className={`${styles.deckAnimation} ${styles[deckAnimation]}`}></div>
              </div>
            )}

          {/* Animacja zwyciezcy */}
          {potWinnerAnimation && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-yellow-400/80 text-black font-extrabold text-2xl md:text-4xl px-6 py-3 rounded-xl shadow-lg ${styles['animate-fadeInOut']} text-center">
                  Pot[{potWinnerAnimation.potIndex}]: {potWinnerAnimation.winnerNicknames.join(", ")}<br/>
                  <span className="text-xl md:text-3xl text-green-800">+${potWinnerAnimation.amount}</span>
                </div>
              </div>
          )}




          {players.map((player, index) => {
            const angle = (index / maxPlayers) * 2 * Math.PI - Math.PI / 2;
            const radiusX = isMobile
              ? tableWidth / 2 - 45
              : tableWidth / 2 + 60;

            const radiusY = isMobile
              ? tableHeight / 2 - 65
              : tableHeight / 2 + 60;

            const x = radiusX * Math.cos(angle);
            const y = radiusY * Math.sin(angle);

            return (
              <div
                key={index}
                className={`
                  absolute w-28 h-28 rounded-full flex flex-col items-center justify-center p-2 text-sm font-semibold
                  transition-all duration-300 transform hover:scale-110
                  ${player.playerId
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg ring-2 ring-white/40"
                    : "bg-gray-600/70 text-gray-200 ring-2 ring-black/20"
                  }
                  ${player.playerId === currentTurnPlayerId ? 'ring-4 ring-yellow-400' : ''}
                `}
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                
                {player.playerId ? (
                  <>
                    {player.playerId === currentTurnPlayerId && turnTimer !== null && (
                        <div className={`mt-1 font-bold text-lg ${
                            turnTimer <= 5 ? "text-red-500 animate-pulse" : "text-yellow-300"
                        }`}>
                          ⏳ {turnTimer}s
                        </div>
                    )}
                    <div className="truncate max-w-[80px] text-center font-bold">{player.nickname}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                      <div className="text-white font-semibold text-sm">${player.saldo}</div>
                    </div>

                    {(player.playerId === userId ? hand : revealedHands[player.playerId])?.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {(player.playerId === userId ? hand : revealedHands[player.playerId])?.map((card, i) => {
                        const isRed = card.suit === "♥" || card.suit === "♦"; // czerwone kolory
                        return (
                          <div key={i} className={`w-12 h-16 bg-white rounded-md flex items-center justify-center text-sm font-bold shadow-md ${isRed ? 'text-red-600' : 'text-black'}`}>
                            {card.rank}{card.suit}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="absolute top-[100%] flex flex-col items-center mb-1 text-white text-xs font-semibold">
                    <div className="bg-black/60 px-2 py-1 rounded-md text-yellow-300 shadow-md">
                      Bet gracza: ${player.bet || 0}
                    </div>
                    <div className="mt-1 bg-gray-800/70 px-2 py-1 rounded-md text-blue-300 shadow-md">
                      Akcja: {player.lastAction || "-"}
                    </div>
                  </div>

                  
                  </>
                ) : (
                  <div className="text-gray-200 font-medium">Wolne</div>
                )}
                
              </div>
              
            );
            
          })}
          
    
          <div
            className="absolute flex items-center justify-center select-none text-white text-6xl font-extrabold opacity-60"
            style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.5)" }}
          >
            POKER

          </div>
          <div
              className="absolute bottom-[38%] left-1/2 transform -translate-x-1/2 text-white text-lg font-semibold bg-black/50 px-3 py-1 rounded-md shadow-md"
            >
              Aktualny bet: ${Math.max(...players.map(p => p.bet || 0))}
            </div>
        </div>
      </div>

      {/* Panel dolny */}
      <div className="w-full max-w-5xl mt-4 flex flex-col items-center gap-4">
        <div className="bg-black/50 p-4 rounded-2xl w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-300">Pula:</div>
            <div className="flex flex-col gap-1">
              {pots.map(p => (
                  <div
                      key={p.index}
                      className="text-sm text-yellow-300 font-semibold"
                  >
                    {p.index === 0 ? "Main pot" : `Side pot #${p.index}`}: ${p.amount}
                  </div>
              ))}

              <div className="text-xl font-bold text-white border-t border-white/20 mt-1 pt-1">
                Razem: ${totalPot}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {communityCards.map((c, i) => {
              const isRed = c.suit === "♥" || c.suit === "♦"; // ♥ i ♦ na czerwono
              return (
                <div
                  key={i}
                  className={`w-16 h-20 bg-white rounded-md flex items-center justify-center font-bold shadow-md ${isRed ? 'text-red-600' : 'text-black'}`}
                >
                  {c.rank}{c.suit}
                </div>
              );
            })}
          </div>
        </div>

        {currentTurnPlayerId === userId && round !== "showdown" && (
          <div className="bg-gray-800/70 p-4 rounded-xl flex items-center gap-3 w-full justify-center flex-wrap">
            <button onClick={() => socket.emit("makeAction", { lobbyId, playerId: userId, action: "fold" })} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition">Pasuj</button>
            <button onClick={() => socket.emit("makeAction", { lobbyId, playerId: userId, action: "check" })} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition">Czekaj</button>
            <button onClick={() => socket.emit("makeAction", { lobbyId, playerId: userId, action: "call" })} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Sprawdź</button>
            <input type="number" value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} placeholder="Kwota przebicia" className="w-28 p-2 rounded text-black" />
            <button onClick={() => { socket.emit("makeAction", { lobbyId, playerId: userId, action: "raise", amount: raiseAmount }); setRaiseAmount(0); }} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition">Podbij</button>
            <button onClick={() => socket.emit("makeAction", { lobbyId, playerId: userId, action: "allin" })} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition">All-in</button>
          </div>
        )}
      </div>
    </div>
  );
}
