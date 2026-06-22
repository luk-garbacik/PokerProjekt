// client/LobbyList.tsx

import { useEffect, useState } from "react";
import CreateLobbyModal from "./CreateLobbyModal";
import "./mobile.css";
type Lobby = {
  id_lobby: number;
  max_players: number;
  current_players: number;
  small_blind: number;
  big_blind: number;
  entry_fee: number;
  status: string;
  private: boolean;
  owner_id: number | null;
};

type Props = {
  nickname: string;
  userId: number;
  onJoinPoker: (lobby: Lobby, pin?: string) => void;
};

export default function LobbyList({ nickname, userId, onJoinPoker }: Props) {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  // 🔹 Funkcja fetchLobbies wyniesiona poza useEffect, żeby móc ją wywołać ręcznie
  const fetchLobbies = async () => {
    try {
      const res = await fetch("http://localhost:5000/lobby");
      if (!res.ok) throw new Error("Błąd sieci: " + res.status);
      const data = await res.json();
      setLobbies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLobbies();
    const interval = setInterval(fetchLobbies, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinClick = (lobby: Lobby) => {
    if (lobby.private) {
      setSelectedLobby(lobby);
      setShowPinModal(true);
      setPin(["", "", "", "", "", ""]);
      return;
    }

    // Tylko przekazanie do GameLobby
    onJoinPoker(lobby);
  };

  const handlePinChange = (value: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
  };

  const handlePinSubmit = () => {
    if (!selectedLobby) return;
    onJoinPoker(selectedLobby, pin.join(""));
    setShowPinModal(false);
  };

  return (
      <div className="space-y-4">

        {/* HEADER */}
        <div className="flex justify-between items-center">

          <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + Utwórz lobby
          </button>
        </div>

        {/* MODAL */}
        {showCreateModal && (
            <CreateLobbyModal
                userId={userId}
                onClose={() => setShowCreateModal(false)}
                onCreated={() => {
                  setShowCreateModal(false);
                  fetchLobbies(); // 🔥 odśwież po utworzeniu
                }}
            />
        )}

        {/* TABLE HEADER */}
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs uppercase text-gray-500 border-b border-gray-700">
          <div>ID</div>
          <div>Blindy</div>
          <div>Stawka</div>
          <div>Gracze</div>
          <div>Typ</div>
          <div></div>
        </div>

        {/* EMPTY */}
        {lobbies.length === 0 && (
            <div className="text-gray-500 text-center py-10">
              Brak dostępnych lobby
            </div>
        )}

        {/* LISTA */}
        <div className="space-y-2 max-h-[500px] overflow-auto pr-1">

          {lobbies.map((lobby) => (
              <div
                  key={lobby.id_lobby}
                  className="grid grid-cols-6 gap-2 items-center px-4 py-3 rounded-xl bg-gray-800/40 hover:bg-gray-700/50 transition border border-gray-700/40"
              >
                <div className="text-gray-300 font-mono">
                  #{lobby.id_lobby}
                </div>

                <div className="text-gray-300">
                  {lobby.small_blind}/{lobby.big_blind}
                </div>

                <div className="text-green-400 font-medium">
                  ${lobby.entry_fee}
                </div>

                <div className="text-gray-300">
                  {lobby.current_players}/{lobby.max_players}
                </div>

                <div className="text-sm">
            <span className={`px-2 py-1 rounded-md text-xs ${
                lobby.private
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-green-500/20 text-green-400"
            }`}>
              {lobby.private ? "Prywatna" : "Publiczna"}
            </span>
                </div>

                <div>
                  <button
                      onClick={() => handleJoinClick(lobby)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm font-semibold transition"
                  >
                    Dołącz
                  </button>
                </div>
              </div>
          ))}

        </div>

        {/* PIN MODAL */}
        {showPinModal && selectedLobby && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[320px] relative">

                <button
                    onClick={() => setShowPinModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg"
                >
                  ✕
                </button>

                <h3 className="text-white text-lg mb-4 text-center">
                  PIN do lobby #{selectedLobby.id_lobby}
                </h3>

                <div className="flex justify-between mb-4">
                  {pin.map((p, i) => (
                      <input
                          key={i}
                          type="text"
                          value={p}
                          maxLength={1}
                          onChange={(e) => handlePinChange(e.target.value, i)}
                          className="w-10 h-10 text-center bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                  ))}
                </div>

                <button
                    onClick={handlePinSubmit}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-semibold transition"
                >
                  Dołącz
                </button>

              </div>
            </div>
        )}

      </div>
  );

}
