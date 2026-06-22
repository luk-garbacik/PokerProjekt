import React, { useState, useEffect } from "react";

type Props = {
    saldo: number;
    userId: number;
    onClose: () => void;
    onPay: (newSaldo: number) => void;
};

export default function PayModal({ saldo, userId, onClose, onPay }: Props) {
    const [amount, setAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [animSaldo, setAnimSaldo] = useState(saldo);

    const quickAmounts = [10, 50, 100, 200, 500];

    const handleSubmit = async () => {
        if (!amount || amount <= 0) {
            setError("Niepoprawna kwota");
            return;
        }

        const res = await fetch("http://localhost:5000/create-checkout-session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, amount }),
        });

        const data = await res.json();

        window.location.href = data.url; // przekierowanie do Stripe
    };


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-11/12 max-w-2xl p-8 text-white relative">

                <h2 className="text-3xl font-bold mb-4 text-yellow-400">
                    Doładuj saldo (Sandbox)
                </h2>

                <div className="bg-gray-800 p-4 rounded-xl mb-6 text-center text-2xl font-bold text-green-400">
                    Saldo: ${animSaldo.toFixed(2)}
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                    {quickAmounts.map((a) => (
                        <button
                            key={a}
                            onClick={() => setAmount(a)}
                            className="bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold"
                        >
                            ${a}
                        </button>
                    ))}
                </div>

                <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full p-3 mb-4 rounded-lg text-black"
                    placeholder="Wprowadź własną kwotę"
                    disabled={loading}
                />

                {error && <p className="text-red-500 mb-2">{error}</p>}

                {loading && (
                    <p className="text-blue-400 mb-4">
                        Przetwarzanie płatności...
                    </p>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="bg-gray-700 px-6 py-2 rounded-xl"
                        disabled={loading}
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 px-6 py-2 rounded-xl"
                        disabled={loading}
                    >
                        Doładuj
                    </button>
                </div>
            </div>
        </div>
    );
}
