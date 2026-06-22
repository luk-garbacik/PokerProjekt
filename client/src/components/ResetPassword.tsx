import React, { useState, useEffect } from "react";

export default function ResetPassword({
                                          onBack,
                                          token
                                      }: {
    onBack: () => void;
    token: string | null;
}) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (newPassword !== confirmPassword) {
            setError("Hasła się nie zgadzają");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Hasło zmienione");

                setTimeout(() => {
                    onBack();
                }, 2000);
            } else {
                setError(data.error);
            }
        } catch {
            setError("Błąd serwera");
        }
    };

    return (
        <div className="
            bg-gray-900/50
            border
            border-gray-800
            rounded-2xl
            p-5
            sm:p-8
            w-full
            max-w-md
        ">
            <h2 className="text-white text-xl text-center mb-6">
                Ustaw nowe hasło
            </h2>

            <form onSubmit={handleReset} className="flex flex-col gap-4">

                <input
                    type="password"
                    placeholder="Nowe hasło"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="p-3 bg-white/10 text-white rounded-lg"
                />

                <input
                    type="password"
                    placeholder="Powtórz hasło"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="p-3 bg-white/10 text-white rounded-lg"
                />

                <button className="bg-purple-600 text-white p-3 rounded-lg">
                    Zmień hasło
                </button>

            </form>

            {error && <div className="text-red-400 text-center mt-3">{error}</div>}
            {message && <div className="text-green-400 text-center mt-3">{message}</div>}

            <button onClick={onBack} className="text-gray-300 mt-4 w-full text-sm">
                ← Powrót
            </button>
        </div>
    );
}
