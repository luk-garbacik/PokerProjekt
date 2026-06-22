import React, { useState } from "react";

export default function RegisterModule({
                                           onSuccess,
                                           onBackToLogin,
                                       }: {
    onSuccess: () => void;
    onBackToLogin: () => void;
}) {
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (password.length < 6) {
            setError("Hasło min 6 znaków");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Hasła nie są identyczne");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname, email, phone, password }),
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess();
            } else {
                setError(data.error);
            }
        } catch {
            setError("Błąd serwera");
        } finally {
            setLoading(false);
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
            <h2 className="text-white text-2xl text-center mb-6">
                Rejestracja
            </h2>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">

                <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="p-3 bg-white/10 text-white rounded-lg" />
                <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 bg-white/10 text-white rounded-lg" />
                <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 bg-white/10 text-white rounded-lg" />
                <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 bg-white/10 text-white rounded-lg" />
                <input type="password" placeholder="Powtórz hasło" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="p-3 bg-white/10 text-white rounded-lg" />

                {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                <button className="bg-purple-600 text-white p-3 rounded-lg">
                    {loading ? "Tworzenie..." : "Zarejestruj"}
                </button>

            </form>

            <button onClick={onBackToLogin} className="text-gray-300 text-sm mt-4 w-full">
                ← Powrót do logowania
            </button>
        </div>
    );
}