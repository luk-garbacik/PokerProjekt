import { useState } from "react";

type Props = {
    userId: number;
    onClose: () => void;
    onCreated?: () => void; // opcjonalny callback po utworzeniu
};

export default function CreateLobbyModal({ userId, onClose, onCreated }: Props) {
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [smallBlind, setSmallBlind] = useState(2);
    const [isPrivate, setIsPrivate] = useState(false);
    const [pin, setPin] = useState(["", "", "", "", "", ""]);
    const [creating, setCreating] = useState(false);

    const handlePinChange = (value: string, index: number) => {
        const copy = [...pin];
        copy[index] = value.slice(-1);
        setPin(copy);
    };

    const handleCreate = async () => {
        const pinValue = isPrivate ? pin.join("") : null;
        setCreating(true);
        try {
            const res = await fetch("http://PC1-lukasz:5000/lobby", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    owner_id: userId,
                    max_players: maxPlayers,
                    small_blind: smallBlind,
                    private: isPrivate,
                    password: pinValue,
                }),
            });

            const data = await res.json();
            if (data.ok) {
                onCreated?.();
                onClose();
            } else {
                alert("Błąd: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Błąd sieci przy tworzeniu lobby");
        }
        setCreating(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl relative w-[360px]">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white font-bold text-xl"
                >
                    ✕
                </button>
                <h3 className="text-xl font-bold mb-4 text-center text-yellow-400">
                    Utwórz nowe lobby
                </h3>

                <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Maksymalni gracze (4-8)</label>
                    <input
                        type="number"
                        min={4}
                        max={8}
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    />
                </div>

                <div className="mb-3">
                    <label className="block text-gray-300 mb-1">Small Blind</label>
                    <select
                        value={smallBlind}
                        onChange={(e) => setSmallBlind(Number(e.target.value))}
                        className="w-full p-2 rounded bg-gray-700 text-white"
                    >
                        {[2, 5, 10, 15, 20, 25].map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3 flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    <span className="text-gray-300">Prywatne (PIN 6-cyfrowy)</span>
                </div>

                {isPrivate && (
                    <div className="flex justify-between mb-3">
                        {pin.map((p, i) => (
                            <input
                                key={i}
                                type="text"
                                maxLength={1}
                                value={p}
                                onChange={(e) => handlePinChange(e.target.value, i)}
                                className="w-12 h-12 text-center text-white bg-gray-700 border-2 border-yellow-400 rounded"
                            />
                        ))}
                    </div>
                )}

                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold shadow-lg transition transform hover:scale-105"
                >
                    {creating ? "Tworzenie..." : "Utwórz"}
                </button>
            </div>
        </div>
    );
}
