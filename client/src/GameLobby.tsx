// client/GameLobby.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom"; // tutaj nastapila poprawa

import LobbyList from "./LobbyList";
import PokerTable from "./PokerTable";
import { socket } from "./socket";
import RouletteTable from "./RouletteTable";
import PayModal from "./PayModal";
import BlackJackTable from "./BlackJackTable";
import WithdrawModal from "./WithdrawModal";
import TransactionsModal from "./TransactionsModal";
import "./mobile.css";
type Props = {
  nickname: string;
  userId: number;
  saldo: number;
  onLogout: () => void;
  view: "poker" | "ruletka" | "blackjack";
};
export type Lobby = {
  id_lobby: number;
  max_players: number;
  current_players: number;
  small_blind: number;
  big_blind: number;
  entry_fee: number;
  private: boolean;
  owner_id?: number | null;
  players?: { playerId: number; nickname: string; saldo: number }[]; // 👈 dodane
};

export default function GameLobby({ nickname, userId, saldo: initialSaldo, onLogout,view }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lobbyId } = useParams();

  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const [saldo, setSaldo] = useState<number>(initialSaldo);
  const [frozen, setFrozen] = useState<number>(0);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const handleJoin = (lobby: Lobby, pin?: string) => {
    socket.emit(
      "joinLobbyPoker",
      { lobbyId: lobby.id_lobby, playerId: userId, pin },
      (res: any) => {
        console.log("JOIN RESPONSE:", res);
        if (res?.ok) {
          setSelectedLobby({ ...res.lobby, players: res.players }); // 👈 dodaj graczy
          navigate(`/lobby/${res.lobby.id_lobby}`);
        } else {
          alert(res?.error || "Błąd podczas dołączania");
        }
      }
    );
  };

  useEffect(() => {
    if (!lobbyId) return;

    fetch(`http://localhost:5000/lobby/${lobbyId}`)
        .then(res => res.json())
        .then(data => {
          setSelectedLobby({
            ...data,
            players: data.players || [] // tutaj nastapila poprawa
          });
        })
        .catch(err => console.error(err));
  }, [lobbyId]);

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:5000/me/saldo", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (typeof data.saldo === "number") {
          setSaldo(data.saldo);
        }
        if (typeof data.frozen === "number") {
            setFrozen(data.frozen);
        }
      } catch (err) {
        console.error("Saldo sync error:", err);
      }
    };

    fetchSaldo();
  }, []);

  useEffect(() => {
    if (!userId) return;

    socket.emit("auth", { userId });
  }, [userId]);

  const handleLeaveLobby = () => {
    if (!selectedLobby) return;
    socket.emit(
      "leaveLobby",
      { lobbyId: selectedLobby.id_lobby, playerId: userId },
      (res: any) => {
        if (res?.ok) {
          setSelectedLobby(null);
          navigate("/lobby"); // tutaj nastapila poprawa
        } else {
          alert(res?.error || "Błąd podczas wychodzenia z lobby");
        }
      }
    );
  };

  useEffect(() => {
    const handler = (data: { lobbyId: number; players: any[] }) => {

      // 🔹 saldo (ZAWSZE)
      const me = data.players.find(p => p.playerId === userId);
      if (me) {
        setSaldo(parseFloat(me.saldo));
      }

      // 🔹 lobby (TYLKO JEŚLI DOTYCZY)
      if (selectedLobby && selectedLobby.id_lobby === data.lobbyId) {
        setSelectedLobby(prev =>
          prev ? { ...prev, current_players: data.players.length } : prev
        );
      }
    };

    socket.on("playerUpdateFull", handler);
    return () => {
      socket.off("playerUpdateFull", handler);
    };
  }, [userId, selectedLobby]);

  useEffect(() => {
    const saldoHandler = (data: { userId: number; saldo: number }) => {
      if (data.userId === userId) {
        setSaldo(Number(data.saldo));
      }
    };

    socket.on("user:saldoUpdate", saldoHandler);

    return () => {
      socket.off("user:saldoUpdate", saldoHandler);
    };
  }, [userId]);

  useEffect(() => {
    const kickHandler = ({ lobbyId }: { lobbyId: number }) => {

      if (selectedLobby && selectedLobby.id_lobby === lobbyId) {
        alert("Zostałeś wyrzucony z lobby przez administratora");

        // 🔥 cofnięcie do listy lobby
        setSelectedLobby(null);
        navigate("/lobby");
      }
    };

    socket.on("kickedFromLobby", kickHandler);

    return () => {
      socket.off("kickedFromLobby", kickHandler);
    };
  }, [selectedLobby]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") === "success") {
      alert("Płatność zakończona sukcesem 🎉");
    }
  }, []);


  const handleLogout = () => {
    socket.disconnect();
    onLogout();
  };
  const openPayModal = () => setShowPayModal(true);
  const closePayModal = () => setShowPayModal(false);
  const openWithdrawModal = () => setShowWithdrawModal(true);
  const closeWithdrawModal = () => setShowWithdrawModal(false);

  const [showTransactions, setShowTransactions] = useState(false);
  return (

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 text-white">

        <header className="bg-black/30 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

            <span className="text-white text-xl font-semibold">
              Royal Casino
            </span>
              <div className="flex items-center gap-4 text-sm">

                <div
                    onClick={openPayModal}
                    className="bg-gray-800/60 hover:bg-green-600 px-3 py-1 rounded-lg cursor-pointer transition"
                >
                  Doładuj
                </div>


                <div
                    onClick={openWithdrawModal}
                    className="bg-gray-800/60 hover:bg-red-600 px-3 py-1 rounded-lg cursor-pointer transition"
                >
                  Wypłać
                </div>

                <div
                    onClick={() => setShowTransactions(true)}
                    className="bg-gray-800/60 hover:bg-gray-700 px-3 py-1 rounded-lg cursor-pointer"
                >
                  Historia
                </div>


                <div className="text-gray-300">
                  {nickname}
                </div>

                <div className="text-green-400 font-semibold">
                  ${saldo.toFixed(2)}
                 {frozen > 0 && (
                       <span className="text-yellow-400 ml-2">
                           ({frozen.toFixed(2)})
                       </span>
                   )}
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg transition"
                >
                  Wyloguj
                </button>
              </div>
          </div>
        </header>

        <div className="h-6" />

        {/* TABS */}
        {!lobbyId && (
            <div className="flex justify-center gap-3 mt-4 mb-10">
              {[
                { key: "poker", label: "Poker", path: "/lobby" },
                { key: "ruletka", label: "Ruletka", path: "/ruletka" },
                { key: "blackjack", label: "Blackjack", path: "/blackjack" }
              ].map((game) => (
                  <button
                      key={game.key}
                      onClick={() => navigate(game.path)}
                      className={`px-6 py-2 rounded-lg border transition ${
                          location.pathname.startsWith(game.path)
                              ? "bg-purple-600 border-purple-400 text-white"
                              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    {game.label}
                  </button>
              ))}
            </div>
        )}

        {/* MAIN */}
        <main className="max-w-7xl mx-auto px-4 py-10">
          {/* MODALE */}

          {showPayModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <PayModal
                    saldo={saldo}
                    userId={userId}
                    onClose={closePayModal}
                    onPay={(newSaldo) => {
                      setSaldo(newSaldo);
                      closePayModal();
                    }}
                />
              </div>
          )}

          {showWithdrawModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <WithdrawModal
                    saldo={saldo}
                    frozen={frozen}
                    onClose={closeWithdrawModal}
                    onWithdraw={(newSaldo, newFrozen) => {
                      setSaldo(newSaldo);
                      setFrozen(newFrozen);
                      closeWithdrawModal();
                    }}
                />
              </div>
          )}

          {showTransactions && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <TransactionsModal
                    onClose={() => setShowTransactions(false)}
                />
              </div>
          )}

          {view === "poker" && (
              !lobbyId ? (
                  <LobbyList
                      nickname={nickname}
                      userId={userId}
                      onJoinPoker={handleJoin}
                  />
              ) : !selectedLobby ? (
                  <div className="text-center text-gray-400">
                    Ładowanie lobby...
                  </div>
              ) : (
                  <PokerTable
                      lobbyId={selectedLobby.id_lobby}
                      maxPlayers={selectedLobby.max_players}
                      smallBlind={selectedLobby.small_blind}
                      bigBlind={selectedLobby.big_blind}
                      userId={userId}
                      nickname={nickname}
                      saldo={saldo}
                      initialPlayers={selectedLobby.players || []}
                      onLeave={handleLeaveLobby}
                  />
              )
          )}

          {view === "ruletka" && (
              <RouletteTable
                  userId={userId}
                  nickname={nickname}
                  saldo={saldo}
              />
          )}

          {view === "blackjack" && (
              <BlackJackTable
                  userId={userId}
                  nickname={nickname}
                  saldo={saldo}
              />
          )}

        </main>


      <footer className="text-center py-4 text-gray-400 border-t border-gray-700">
        © 2025 Poker Royale. All rights reserved.
      </footer>
    </div>
  );
}
