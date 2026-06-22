import { useEffect, useState } from "react";

type Props = {
    onClose: () => void;
};

export default function PaymentHistoryModal({ onClose }: Props) {
    const [payments, setPayments] = useState<any[]>([]);
    const [userFilter, setUserFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem("token");

            const res = await fetch(
                "http://localhost:5000/admin/payments/history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();
            setPayments(data);
            setLoading(false);
        };

        load();
    }, []);

const filteredPayments = payments.filter((p) => {
    const paymentDate = new Date(p.created_at);

    const matchesUser =
        !userFilter ||
        p.nickname
            ?.toLowerCase()
            .includes(userFilter.toLowerCase());

    const matchesType =
        !typeFilter || p.type === typeFilter;

    const matchesFrom =
        !dateFrom ||
        paymentDate >= new Date(dateFrom);

    const matchesTo =
        !dateTo ||
        paymentDate <=
            new Date(
                new Date(dateTo).setHours(
                    23,
                    59,
                    59,
                    999
                )
            );

    return (
        matchesUser &&
        matchesType &&
        matchesFrom &&
        matchesTo
    );
});

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-xl w-[1000px] max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">
                        Historia wpłat i wypłat
                    </h2>

                    <button
                        onClick={onClose}
                        className="bg-red-600 px-3 py-1 rounded"
                    >
                        Zamknij
                    </button>
                </div>

                <div className="mb-4 grid grid-cols-4 gap-3">
                    <input
                        type="text"
                        placeholder="Użytkownik"
                        value={userFilter}
                        onChange={(e) =>
                            setUserFilter(e.target.value)
                        }
                        className="bg-slate-700 p-2 rounded"
                    />

                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(e.target.value)
                        }
                        className="bg-slate-700 p-2 rounded"
                    >
                        <option value="">Wszystkie</option>
                        <option value="deposit">Wpłaty</option>
                        <option value="withdraw">Wypłaty</option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) =>
                            setDateFrom(e.target.value)
                        }
                        className="bg-slate-700 p-2 rounded"
                    />

                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) =>
                            setDateTo(e.target.value)
                        }
                        className="bg-slate-700 p-2 rounded"
                    />
                </div>

                {loading ? (
                    <p>Ładowanie...</p>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Użytkownik</th>
                                <th>Typ</th>
                                <th>Kwota</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredPayments.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.nickname}</td>
                                    <td>{p.type === "deposit"
                                                ? "Wpłata"
                                                : p.type === "withdraw"
                                                ? "Wypłata"
                                                : p.type}
                                    </td>
                                    <td>{p.amount} zł</td>
                                    <td>{p.status}</td>
                                    <td>
                                        {new Date(
                                            p.created_at
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
