import { useState } from "react";

type Lobby = {
    id_lobby: number;
    max_players: number;
    small_blind: number;
    big_blind: number;
    private: boolean;
    status: string;
};

type Props = {
    lobby: Lobby;
    onClose: () => void;
    onSaved: () => void;
};

export default function EditLobbyModal({
                                           lobby,
                                           onClose,
                                           onSaved,
                                       }: Props) {
    const [form, setForm] = useState({
        max_players: lobby.max_players,
        small_blind: lobby.small_blind,
        big_blind: lobby.small_blind * 2, // 🔥 BB zależne
        private: lobby.private,
        password: "",
        status: lobby.status,
    });

    const bigBlind = form.small_blind * 2;

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (form.max_players < 4 || form.max_players > 10) {
            return "Lobby może mieć od 4 do 10 graczy";
        }

        if (form.small_blind <= 0) {
            return "Small blind musi być większy od 0";
        }

        if (form.private && form.password.length !== 6) {
            return "Hasło musi mieć 6 znaków";
        }

        return "";
    };

    const save = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:5000/admin/lobby/${lobby.id_lobby}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        max_players: form.max_players,
                        small_blind: form.small_blind,
                        private: form.private,
                        password: form.private ? form.password : null,
                        status: form.status,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error("Błąd zapisu");
            }

            onSaved();
        } catch (err) {
            setError("Nie udało się zapisać zmian");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-2xl w-[420px] shadow-2xl space-y-5">

                <h2 className="text-2xl font-bold text-yellow-400">
                    Edytuj Lobby #{lobby.id_lobby}
                </h2>

                <div className="space-y-3">

                    <label className="block text-sm text-gray-300">
                        Max players
                        <select
                            value={form.max_players}
                            onChange={(e) =>
                                setForm({ ...form, max_players: Number(e.target.value) })
                            }
                            className="w-full mt-1 p-2 rounded bg-slate-700"
                        >
                            {[4,5,6,7,8,9,10].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-sm text-gray-300">
                        Small blind
                        <input
                            type="number"
                            min={1}
                            value={form.small_blind}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    small_blind: Number(e.target.value),
                                })
                            }
                            className="w-full mt-1 p-2 rounded bg-slate-700"
                        />
                    </label>

                    <label className="block text-sm text-gray-300">
                        Big blind
                        <input
                            type="number"
                            value={bigBlind}
                            disabled
                            className="w-full mt-1 p-2 rounded bg-slate-900 text-gray-400"
                        />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                            type="checkbox"
                            checked={form.private}
                            onChange={(e) =>
                                setForm({ ...form, private: e.target.checked })
                            }
                        />
                        Lobby prywatne
                    </label>

                    {form.private && (
                        <input
                            type="text"
                            placeholder="Hasło lobby"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            className="w-full p-2 rounded bg-slate-700"
                        />
                    )}

                    <label className="block text-sm text-gray-300">
                        Status
                        <select
                            value={form.status}
                            onChange={(e) =>
                                setForm({ ...form, status: e.target.value })
                            }
                            className="w-full mt-1 p-2 rounded bg-slate-700"
                        >
                            <option value="open">Open</option>
                            <option value="exit">Exit</option>
                        </select>
                    </label>

                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/30 p-2 rounded">
                        {error}
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700"
                        disabled={loading}
                    >
                        Anuluj
                    </button>

                    <button
                        onClick={save}
                        disabled={loading}
                        className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Zapisywanie..." : "Zapisz zmiany"}
                    </button>
                </div>
            </div>
        </div>
    );
}
