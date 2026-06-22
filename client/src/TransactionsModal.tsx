import React, { useEffect, useState } from "react";

type Transaction = {
    id: number;
    type: string;
    amount: number;
    status: string;
    created_at: string;
};

export default function TransactionsModal({ onClose }: { onClose: () => void }) {

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch("http://localhost:5000/transactions", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error);
                } else {
                    setTransactions(data);
                }

            } catch {
                setError("Błąd połączenia");
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

            <div className="bg-gray-900 p-8 rounded-2xl text-white w-[500px] max-h-[80vh] overflow-y-auto">

                <h2 className="text-2xl mb-4 text-yellow-400">
                    Historia transakcji
                </h2>

                {error && <p className="text-red-400">{error}</p>}

                {transactions.map(t => (
                    <div key={t.id} className="border-b border-gray-700 py-2">

                        <div className="flex justify-between">
                            <span
                                className={
                                    t.type === "deposit"
                                        ? "text-green-400"
                                        : "text-red-400"
                                }
                            >
                                {t.type === "deposit" ? "Wpłata" : "Wypłata"}
                            </span>

                                                    <span
                                                        className={
                                                            t.type === "deposit"
                                                                ? "text-green-400"
                                                                : "text-red-400"
                                                        }
                                                    >
                                {t.type === "deposit" ? "+" : "-"}${t.amount}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm text-gray-400">
                            <span className={
                                t.status === "completed"
                                    ? "text-green-400"
                                    : t.status === "pending"
                                        ? "text-yellow-400"
                                        : "text-red-400"
                            }>
                                {t.status}
                            </span>
                            <span>{new Date(t.created_at).toLocaleString()}</span>
                        </div>

                    </div>
                ))}

                <button
                    onClick={onClose}
                    className="mt-4 bg-gray-700 px-4 py-2 rounded w-full"
                >
                    Zamknij
                </button>

            </div>
        </div>
    );
}