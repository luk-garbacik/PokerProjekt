import { useEffect } from "react";

type Props = {
    setSaldo: (value: number) => void;
    setFrozen: (value: number) => void;
};

export default function SuccessPage({ setSaldo, setFrozen }: Props) {

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) return;

            fetch("http://localhost:5000/me/saldo", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                if (typeof data.saldo === "number") {
                    setSaldo(data.saldo);
                }

                if (typeof data.frozen === "number") {
                    setFrozen(data.frozen);
                }
            })
            .catch(err => {
                console.error("Saldo fetch error:", err);
            });

    }, [setSaldo]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white">
            <h1 className="text-3xl font-bold mb-4 text-green-400">
                Płatność zakończona sukcesem 🎉
            </h1>
            <p>Saldo zostało zaktualizowane.</p>
        </div>
    );
}