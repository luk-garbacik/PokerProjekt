import React, { useState } from "react";

type Props = {
    saldo: number;
    frozen: number;
    onClose: () => void;
    onWithdraw: (
        newSaldo: number,
        newFrozen: number
    ) => void;
};

export default function WithdrawModal({ saldo, frozen, onClose, onWithdraw }: Props) {

    const [amount, setAmount] = useState<number>(0);
    const [error, setError] = useState("");

    const handleWithdraw = async () => {
        if (amount <= 0) {
            setError("Niepoprawna kwota");
            return;
        }
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/withdraw", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error);
            return;
        }

        onWithdraw(
            data.saldo,
            frozen + amount
        );

        alert("Wniosek o wypłatę wysłany do administratora");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

            <div className="bg-gray-900 p-8 rounded-2xl text-white w-96">

                <h2 className="text-2xl mb-4 text-red-400">
                    Wypłać środki
                </h2>

                <p className="mb-4">
                    Saldo: ${saldo.toFixed(2)}
                </p>

                <input
                    type="number"
                    value={amount}
                    onChange={(e)=>setAmount(Number(e.target.value))}
                    className="w-full p-3 mb-4 text-black rounded"
                />

                {error && (
                    <p className="text-red-400 mb-3">{error}</p>
                )}

                <div className="flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="bg-gray-700 px-4 py-2 rounded"
                    >
                        Anuluj
                    </button>

                    <button
                        onClick={handleWithdraw}
                        className="bg-red-600 px-4 py-2 rounded"
                    >
                        Wypłać
                    </button>

                </div>
            </div>

        </div>
    );
}
