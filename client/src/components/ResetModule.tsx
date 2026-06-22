import React, { useState } from "react";

export default function ResetModule({ onBack }: { onBack: () => void }) {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await fetch("http://localhost:5000/reset-password-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Sprawdź email");
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
                Reset hasła
            </h2>

            <form onSubmit={handleReset} className="flex flex-col gap-4">

                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-3 bg-white/10 text-white rounded-lg"
                />

                <button className="bg-purple-600 text-white p-3 rounded-lg">
                    Wyślij
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