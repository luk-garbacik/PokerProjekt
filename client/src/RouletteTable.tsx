//RouletteTables.tsx

import { useState, useEffect, useRef } from "react";
import { socket } from "./socket"; 
import "./roulette-table.css";
import "./rouletteMobile.css";
const slotAngles = [
  { number: 0, color: "green" },
  { number: 32, color: "red" },
  { number: 15, color: "black" },
  { number: 19, color: "red" },
  { number: 4, color: "black" },
  { number: 21, color: "red" },
  { number: 2, color: "black" },
  { number: 25, color: "red" },
  { number: 17, color: "black" },
  { number: 34, color: "red" },
  { number: 6, color: "black" },
  { number: 27, color: "red" },
  { number: 13, color: "black" },
  { number: 36, color: "red" },
  { number: 11, color: "black" },
  { number: 30, color: "red" },
  { number: 8, color: "black" },
  { number: 23, color: "red" },
  { number: 10, color: "black" },
  { number: 5, color: "red" },
  { number: 24, color: "black" },
  { number: 16, color: "red" },
  { number: 33, color: "black" },
  { number: 1, color: "red" },
  { number: 20, color: "black" },
  { number: 14, color: "red" },
  { number: 31, color: "black" },
  { number: 9, color: "red" },
  { number: 22, color: "black" },
  { number: 18, color: "red" },
  { number: 29, color: "black" },
  { number: 7, color: "red" },
  { number: 28, color: "black" },
  { number: 12, color: "red" },
  { number: 35, color: "black" },
  { number: 3, color: "red" },
  { number: 26, color: "black" },
].map((slot, index) => ({
  ...slot,
  angle: index * (360 / 37),
}));

const ROUND_TIME = 43_000;
const CLOSE_BEFORE_SPIN = 5_000; // 5s przed spinem

let spinInProgress = false;

export default function RouletteTable({
  userId,
  nickname,
  saldo
}: {
  userId: number;
  nickname: string;
  saldo: number;
}) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [ballRotation, setBallRotation] = useState(0);
  const [tableRotation, setTableRotation] = useState(0);
  const ballRotationRef = useRef<number>(0);
  const isMobile = window.innerWidth <= 768;
  const ballRadius = isMobile ? 138 : 205;
  const [betValue, setBetValue] = useState(10);

  // blokada zakladow
  const [bettingClosed, setBettingClosed] = useState(false);

  //  historia wyników
  const [history, setHistory] = useState<any[]>([]);

  const [timeLeft, setTimeLeft] = useState(43);

  type CurrentBets = {
    red: number;
    black: number;
    green: number;

    even: number;
    odd: number;

    firstHalf: number;
    secondHalf: number;

    numbersTotal: number;

    dozen1: number;
    dozen2: number;
    dozen3: number;

    column1: number;
    column2: number;
    column3: number;

    total: number;
  };

  // aktualne zaklady
  const [currentBets, setCurrentBets] = useState<CurrentBets>({
    red: 0,
    black: 0,
    green: 0,
    even: 0,
    odd: 0,
    firstHalf: 0,
    secondHalf: 0,
    numbersTotal: 0,

    dozen1: 0,
    dozen2: 0,
    dozen3: 0,

    column1: 0,
    column2: 0,
    column3: 0,

    total: 0,
  });


  useEffect(() => {
    const onTimer = ({ remainingMs, bettingClosed }: any) => {
      setTimeLeft(Math.ceil(remainingMs / 1000));
      setBettingClosed(bettingClosed);
    };

    socket.on("rouletteTimer", onTimer);

    return () => {
      socket.off("rouletteTimer", onTimer);
    };
  }, []);



  useEffect(() => {
    // pobierz stan przy podłączeniu
    socket.emit("getRouletteState", (res: any) => {
      if (res?.ok) {
        setCurrentBets({
          ...res.currentBets,
          total: Number(res.currentBets.total)
        });
        
        if (res.currentRound) {
          setResult(res.currentRound.result_number);
        }
      } else {
        console.error("Błąd ładowania stanu ruletki", res?.error);
      }
    });

    // pobranie historii
    function fetchHistory() {
      socket.emit("getRouletteState", (res: any) => {
        if (res?.ok) {
          setHistory(res.history || []);
        }
      });
    }

    fetchHistory();

    // subskrypcje
    const onBets = (payload: any) => {
      if (payload?.currentBets) setCurrentBets(payload.currentBets);
    };

    const onSpun = (payload: any) => {
      if (payload?.round) {
        setResult(payload.round.result_number);
      
        animateSpinTo(payload.round.result_number);

        setTimeout(() => {
          if (payload.currentBets) {
            setCurrentBets(payload.currentBets);
          }
          setHistory((payload.history || []).slice(0, 5));

        }, 8000);
      }
    };


    socket.on("rouletteBetsUpdated", onBets);
    socket.on("rouletteSpun", onSpun);

    return () => {
      socket.off("rouletteBetsUpdated", onBets);
      socket.off("rouletteSpun", onSpun);
    };
  }, []);

  useEffect(() => {
    const handler = ({ bettingClosed }: { bettingClosed: boolean }) => {
      setBettingClosed(bettingClosed);
    };

    socket.on("rouletteStatus", handler);

    return () => {
      socket.off("rouletteStatus", handler);
    };
  }, []);

  function updateBallRotation(next: number | ((prev: number) => number)) {
    setBallRotation(prev => {
      const value = typeof next === "function" ? (next as any)(prev) : next;
      ballRotationRef.current = value;
      return value;
    });
    
    if (typeof next !== "function") ballRotationRef.current = next;
  }

  function updateTableRotation(next: number | ((prev: number) => number)) {
    setTableRotation(prev => {
      return typeof next === "function" ? (next as any)(prev) : next;
    });
  }


  function animateSpinTo(chosenNumber: number) {
  if (spinning) return;
  const slot = slotAngles.find(s => s.number === chosenNumber);
  if (!slot) return;

  const GRAPHIC_OFFSET = 90;

  // pozycja pilki
  const currentBall = (((ballRotationRef.current + GRAPHIC_OFFSET) % 360) + 360) % 360;

  // kąt slotu 
  const slotAngle = slot.angle;
  let target = ((slotAngle % 360) + 360) % 360;

  // liczymy ile jeszcze ma się obrócić piłka, żeby trafić w target
  let delta = target - currentBall;
  delta = ((delta % 360) + 360) % 360;

  setSpinning(true);
  setResult(null);

  const randomTableRotation = 360 + Math.random() * 360;
  // obrót stołu o 360°
  updateTableRotation(prev => prev - randomTableRotation);

  // obrot pilki
  updateBallRotation(prev => prev + 360 * 8);

  setTimeout(() => {
    updateBallRotation(prev => prev + 360 * 2 + delta);
  }, 200);

  setTimeout(() => {
    setResult(chosenNumber);
    setSpinning(false);
  }, 8000);
}


  // const requestSpin = () => {
  //   socket.emit("requestSpin", {}, (res:any) => {
  //     if (!res?.ok) alert("Spin failed: " + res?.error);
  //   });
  // };

  const getColor = (n: number | null) => {
    if (n === null) return "";
    const slot = slotAngles.find((s) => s.number === n);
    return slot ? slot.color.toUpperCase() : "";
  };

  const centerColor = result === null 
     ? "black" 
     : slotAngles.find(s => s.number === result)?.color ?? "black";

  type RouletteBetType =
      | "number"
      | "color"
      | "parity"
      | "1to18"
      | "dozen"
      | "column";


  const placeBet = (betType: RouletteBetType, betValue: number, amount: number) => {
    if (bettingClosed) {
      return;
    }

    socket.emit(
      "placeRouletteBet",
      {
        userId,     // zmienna userId jest przekazywana jako prop do komponentu
        betType,    // "color", "number", parity, 1to18
        betValue,   // np. 1=red, 2=black, lub numer 7 itp.
        amount      // wartość z suwaka (betValueState / betAmount)
      },
      (res: any) => {
      console.log("DEBUG FRONTEND — odpowiedź backendu:", res);

      if (!res?.ok) {
        alert("Nie udało się postawić zakładu: " + (res?.error || "unknown"));
      } else {
        console.log("Bet placed OK");
      }
      }
    );
  };

  return (
    <>
    <div className="w-full flex flex-row items-start justify-center gap-36 py-10">
         {/* LEWA – HISTORIA WYNIKÓW */}
      <div className="w-1/5 bg-neutral-800/60 text-white p-4 rounded-xl shadow-lg">
        <div className="text-center text-2xl font-bold mb-4">
          {bettingClosed
              ? "⛔ Zakłady zamknięte"
              : `⏱ Spin za ${timeLeft}s`}
        </div>
        <h2 className="text-xl font-bold mb-3">Historia wyników</h2>

        <div className="space-y-2">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-2 rounded bg-neutral-700/50"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ background: h.color }}>
                {h.number}
              </div>
              <div className="text-sm uppercase">{h.color}</div>
            </div>
          ))}
        </div>
      </div>

         {/* SRODKE – STOLIK RULETKI */}

      <div className="relative w-full max-w-[500px] aspect-square roulette-wheel-container">
        {/* TARCZA */}
        <div className="absolute inset-0 m-auto w-[490px] h-[490px] rounded-full bg-gray flex items-center justify-center"
          style={{
            boxShadow: "0 0 8px rgba(192, 147, 147, 0.8), inset -2px -2px 4px rgba(0,0,0,0.4)",
            transform: `rotate(${tableRotation}deg)`,
            transition: "transform 7s  ease-out",

      }}
        >

          <div className="absolute inset-0 m-auto w-[480px] h-[480px] rounded-full bg-white flex items-center justify-center">

            {/* OBRECZ  */}
            <div
              className="
                rounded-full
                w-[80%] h-[80%]
                z-10
                bg-gradient-to-br from-neutral-700/60 to-neutral-900/60
                border-[8px] border-neutral-800 
                shadow-[inset_0_0_20px_rgba(0,0,0,0.8),_0_0_15px_rgba(255,255,255,0.2)]
                shadow-inner
                relative
                backdrop-blur-sm
              "
              style={{
                boxShadow:
                  "inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.4)",
              }}
            >

            {/* PILKA  */}
              <div
                className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full z-50"
                style={{
                  background: `
                    radial-gradient(circle at 30% 30%, white 0%, #ddd 40%, #aaa 70%, #888 100%)
                  `,
                  boxShadow: "0 0 8px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(0,0,0,0.4)",
                  transform: `translate(-50%, -50%) rotate(${ballRotation}deg) translate(${ballRadius - 3 }px)`,
                  transition: "transform 8s ease-out",
                }}
              ></div>


              {/* ŚRODEK Z WYNIKIEM */}
              <div
                className="
                  absolute rounded-full
                  flex items-center justify-center
                  text-4xl font-extrabold tracking-wide
                "
               

                style={{
                  width: "50%",
                  height: "50%",
                  top: "50%",
                  left: "50%",

                  color: centerColor,
                  /* gradient w środku – kolor → czarny */
                  background:
                    centerColor === "red"
                      ? "radial-gradient(circle, rgba(255,0,0,1) 40%, rgba(0,0,0,0.0) 70%)"
                      : centerColor === "black"
                      ? "radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0.0) 70%)"
                      : centerColor === "green"
                      ? "radial-gradient(circle, rgba(0,180,0,1) 40%, rgba(0,0,0,0.4) 70%)"
                      : "radial-gradient(circle, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0) 70%)",

                  transform: "translate(-50%, -50%)",

                  textShadow: `
                    -2px -2px 0 rgba(255, 255, 255, 1),
                    2px -2px 0 rgba(255, 255, 255, 1),
                    -2px  2px 0 rgba(255, 255, 255, 1),
                    2px  2px 0 rgba(255, 255, 255, 1)
                  `,
                }}
              >
                {result !== null ? result : ""}
              </div>
            </div>


            {/* SLOTY 0-36 */}
            {slotAngles.map((slot) => (
              <div
                key={slot.number}
                className="absolute bottom-1/2 origin-bottom -translate-x-1/2 -translate-y-full"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "21px solid transparent",
                  borderRight: "21px solid transparent",
                  borderTop: `240px solid ${slot.color}`,
                  transform: `rotate(${slot.angle}deg)`,
                  filter: "drop-shadow(0px 0px 4px rgba(0,0,0,0.6))",
                }}
              >
                <div
                  className="absolute left-1/2 bottom-[220px] 
                    -translate-x-1/2 text-white font-bold text-sm
                    drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                  style={{ userSelect: "none" }}
                >
                  {slot.number}
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* PRAWA – AKTUALNE ZAKŁADY */}
      <div className="w-1/5 bg-neutral-800/60 text-white p-4 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-3">Aktualne zakłady</h2>

        <div
            className="
              space-y-2 text-lg
              max-h-[300px]
              overflow-y-auto
              pr-2
              scrollbar-thin
              scrollbar-thumb-neutral-600
              scrollbar-track-neutral-800
            "
        >
          <div className="flex justify-between">
              <span>🔴 Czerwone:</span>
              <span className="font-bold">{Number(currentBets.red)} zł</span>
            </div>

            <div className="flex justify-between">
              <span>⚫ Czarne:</span>
              <span className="font-bold">{Number(currentBets.black)} zł</span>
            </div>

            <div className="flex justify-between">
              <span>🟢 Zielone:</span>
              <span className="font-bold"> {Number(currentBets.green)} zł </span>
            </div>

            <div className="flex justify-between">
              <span>🟦 Parzyste:</span>
              <span className="font-bold">{Number(currentBets.even)} zł</span>
            </div>

            <div className="flex justify-between">
              <span>🟨 Nieparzyste:</span>
              <span className="font-bold">{Number(currentBets.odd)} zł</span>
            </div>

            <div className="flex justify-between">
              <span>🥇 1-18:</span>
              <span className="font-bold">{Number(currentBets.firstHalf)} zł</span>
            </div>

            <div className="flex justify-between">
              <span>🥈 19-36:</span>
              <span className="font-bold">{Number(currentBets.secondHalf)} zł</span>
            </div>

            <div className="flex justify-between">
              <span>🎯 Numery:</span>
              <span className="font-bold"> {Number(currentBets.numbersTotal)} zł </span>
            </div>

            <div className="flex justify-between">
              <span>📦 1st 12:</span>
              <span className="font-bold">{currentBets.dozen1} zł</span>
            </div>

            <div className="flex justify-between">
              <span>📦 2nd 12:</span>
              <span className="font-bold">{currentBets.dozen2} zł</span>
            </div>

            <div className="flex justify-between">
              <span>📦 3rd 12:</span>
              <span className="font-bold">{currentBets.dozen3} zł</span>
            </div>

            <div className="flex justify-between mt-2">
              <span>📊 Kolumna 1:</span>
              <span className="font-bold">{currentBets.column1} zł</span>
            </div>

            <div className="flex justify-between">
              <span>📊 Kolumna 2:</span>
              <span className="font-bold">{currentBets.column2} zł</span>
            </div>

            <div className="flex justify-between">
              <span>📊 Kolumna 3:</span>
              <span className="font-bold">{currentBets.column3} zł</span>
            </div>
          </div>
          <div className="border-t border-neutral-600 pt-2 flex justify-between text-xl font-bold">
            <span>💰 Cała pula:</span>
            <span>
              <span>{Number(currentBets.total)} zł</span>
            </span>
          </div>
        </div>
      </div>


      {/* STÓŁ DO ZAKŁADÓW */}
      <div className="max-w-[1000px] w-full mx-auto text-white text-center select-none
                  bg-green-700 p-4 rounded-xl shadow-xl roulette-table">
        <div className="mt-10 w-full mx-auto text-white text-center select-none">
          <div className="flex items-center justify-center gap-4 mb-6 mt-4 bet-slider-area">
            <span className="text-lg font-semibold">Wysokość zakładu:</span>

            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={betValue}
              onChange={(e) => setBetValue(Number(e.target.value))}
              className="w-64 accent-yellow-500"
            />

            <span className="text-xl font-bold w-16 text-left">{betValue} zł</span>
          </div>
          <div className="grid grid-cols-14 gap-1">
            <div></div>
            <div onClick={() => placeBet("number", 3, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
              3
            </div>
            <div onClick={() => placeBet("number", 6, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
              6
            </div>
            <div onClick={() => placeBet("number", 9, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
              9
            </div>
            <div onClick={() => placeBet("number", 12, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
              12
            </div>
            <div onClick={() => placeBet("number", 15, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
              15
            </div>
            <div onClick={() => placeBet("number", 18, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
              18
            </div>
            <div onClick={() => placeBet("number", 21, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
              21
            </div>
            <div onClick={() => placeBet("number", 24, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
              24
            </div>
            <div onClick={() => placeBet("number", 27, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
              27
            </div>
            <div onClick={() => placeBet("number", 30, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
              30
            </div>
            <div onClick={() => placeBet("number", 33, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
              33
            </div>
            <div onClick={() => placeBet("number", 36, betValue)}
                className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
              36
            </div>

            <div onClick={() => placeBet("column", 3, betValue)}
                 className="p-2 rounded bg-neutral-700 roulette-tile roulette-number tile-gray">
              2 TO 1
            </div>
          </div>

            {/* Rząd 2 */}
            <div className="grid grid-cols-14 gap-1 mt-1">
              <div onClick={() => placeBet("number", 0, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-green bg-green-600">
                0
              </div>
              <div onClick={() => placeBet("number", 2, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                2
              </div>
              <div onClick={() => placeBet("number", 5, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                5
              </div>
              <div onClick={() => placeBet("number", 8, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                8
              </div>
              <div onClick={() => placeBet("number", 11, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                11
              </div>
              <div onClick={() => placeBet("number", 14, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                14
              </div>
              <div onClick={() => placeBet("number", 17, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                17
              </div>
              <div onClick={() => placeBet("number", 20, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                20
              </div>
              <div onClick={() => placeBet("number", 23, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                23
              </div>
              <div onClick={() => placeBet("number", 26, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                26
              </div>
              <div onClick={() => placeBet("number", 29, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                29
              </div>
              <div onClick={() => placeBet("number", 32, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                32
              </div>
              <div onClick={() => placeBet("number", 35, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                35
              </div>

              <div onClick={() => placeBet("column", 2, betValue)}
                   className="p-2 rounded bg-neutral-700 roulette-tile roulette-number tile-gray">
                2 TO 1
              </div>
            </div>

            {/* Rząd 3 */}
            <div className="grid grid-cols-14 gap-1 mt-1 mb-1">
              <div></div>
              <div onClick={() => placeBet("number", 1, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                1
              </div>
              <div onClick={() => placeBet("number", 4, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                4
              </div>
              <div onClick={() => placeBet("number", 7, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                7
              </div>
              <div onClick={() => placeBet("number", 10, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                10
              </div>
              <div onClick={() => placeBet("number", 13, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                13
              </div>
              <div onClick={() => placeBet("number", 16, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                16
              </div>
              <div onClick={() => placeBet("number", 19, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                19
              </div>
              <div onClick={() => placeBet("number", 22, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                22
              </div>
              <div onClick={() => placeBet("number", 25, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                25
              </div>
              <div onClick={() => placeBet("number", 28, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                28
              </div>
              <div onClick={() => placeBet("number", 31, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-red">
                31
              </div>
              <div onClick={() => placeBet("number", 34, betValue)}
                  className="p-2 rounded cursor-pointer roulette-tile roulette-number tile-black">
                34
              </div>
              <div onClick={() => placeBet("column", 1, betValue)}
                   className="p-2 rounded bg-neutral-700 roulette-tile roulette-number tile-gray">
                2 TO 1
              </div>
            </div>


          {/* TUZINY */}
          <div className="grid grid-cols-3 gap-1 mt-2 mb-2">
            <div onClick={() => placeBet("dozen", 1, betValue)} className="p-2 rounded bg-neutral-700 roulette-tile tile-gray">1st 12</div>
            <div onClick={() => placeBet("dozen", 2, betValue)} className="p-2 rounded bg-neutral-700 roulette-tile tile-gray">2nd 12</div>
            <div onClick={() => placeBet("dozen", 3, betValue)} className="p-2 rounded bg-neutral-700 roulette-tile tile-gray">3rd 12</div>
          </div>

          {/* Dół – 1–18, even, red, black, odd, 19–36 */}
          <div className="grid grid-cols-6 gap-1">
            <button disabled={bettingClosed} onClick={() => placeBet('1to18', 1, betValue)} className="p-2 bg-yellow-600  rounded roulette-tile tile-control ">1to18</button>
            <button disabled={bettingClosed} onClick={() => placeBet('parity', 1, betValue)} className="p-2 bg-yellow-600  rounded roulette-tile tile-control">EVEN</button>
            <button disabled={bettingClosed} onClick={() => placeBet('color', 1, betValue)} className="p-2 bg-red-600  rounded roulette-tile tile-control">RED</button>
            <button disabled={bettingClosed} onClick={() => placeBet('color', 2, betValue)} className="p-2 bg-black  rounded roulette-tile tile-control">BLACK</button>
            <button disabled={bettingClosed} onClick={() => placeBet('parity', 2, betValue)} className="p-2 bg-yellow-600  rounded roulette-tile tile-control">ODD</button>
            <button disabled={bettingClosed} onClick={() => placeBet('1to18', 2, betValue)} className="p-2 bg-yellow-600  rounded roulette-tile tile-control">19to36</button>
          </div>
        </div>
      </div>
      </>
  );
}
