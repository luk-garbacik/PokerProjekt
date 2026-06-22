import { useState, useEffect } from "react";
import EditLobbyModal from "./admin/EditLobbyModal";
import EditUserModal, {User} from "./admin/EditUserModal";
import PaymentHistoryModal from "./admin/paymentHistoryModal";
type Props = {
    onLogout: () => void;
};

type View = "dashboard" | "users" | "lobbies" | "withdraws";

type Player = {
    id_user: number;
    nickname: string;
    saldo: number;
};

type Lobby = {
    id_lobby: number;
    max_players: number;
    current_players: number;
    small_blind: number;
    big_blind: number;
    status: string;
    private: boolean;
    players: Player[];
};

export default function AdminPanel({ onLogout }: Props) {
    const [activeView, setActiveView] = useState<View>("dashboard");
    const [lobbies, setLobbies] = useState<Lobby[]>([]);
    const [loadingLobbies, setLoadingLobbies] = useState(false);
    const [dashboardStats, setDashboardStats] = useState({
        users: 0,
        activeLobbies: 0,
        dailyTurnover: 0,
    });
    const [search, setSearch] = useState("");
    const [filterPrivate, setFilterPrivate] = useState<"all" | "public" | "private">("all");
    const [sortBy, setSortBy] = useState<"id" | "players" | "blind">("id");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;
    const [filterStatus, setFilterStatus] = useState<"all" | "open" | "exit">("all");
const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    useEffect(() => {
        if (activeView === "dashboard") {
            fetchDashboardStats();
        }
    }, [activeView]);

    // 🔹 Pobieranie lobby przy wejściu w zakładkę
    useEffect(() => {
        if (activeView === "lobbies") {
            fetchLobbies();
        }
    }, [activeView]);

    const fetchLobbies = async () => {
        try {
            setLoadingLobbies(true);
            const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:5000/admin/lobbies", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 401 || res.status === 403) {
                alert("Sesja wygasła lub brak uprawnień");
                onLogout();
                return;
            }

            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error("Backend nie zwrócił tablicy:", data);
                setLobbies([]);
                return;
            }
            setLobbies(data);

        } catch (err) {
            console.error("Błąd pobierania lobby:", err);
        } finally {
            setLoadingLobbies(false);
        }
    };

    const processedLobbies = lobbies
        .filter((lobby) => {
            const matchesSearch =
                lobby.id_lobby.toString().includes(search) ||
                lobby.status.toLowerCase().includes(search.toLowerCase());

            const matchesFilter =
                filterPrivate === "all" ||
                (filterPrivate === "public" && !lobby.private) ||
                (filterPrivate === "private" && lobby.private);

            const matchesStatus =
                filterStatus === "all" ||
                lobby.status === filterStatus;
            return matchesSearch && matchesFilter && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === "id") return a.id_lobby - b.id_lobby;
            if (sortBy === "players") return b.current_players - a.current_players;
            if (sortBy === "blind") return b.big_blind - a.big_blind;
            return 0;
        });

    const totalPages = Math.ceil(processedLobbies.length / itemsPerPage);
    const paginatedLobbies = processedLobbies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const [editingLobby, setEditingLobby] = useState<Lobby | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const currentUserId = JSON.parse(
        atob(localStorage.getItem("token")!.split(".")[1])
    ).id;
    useEffect(() => {
        if (activeView === "users") {
            fetchUsers();
        }
    }, [activeView]);

    const fetchDashboardStats = async () => {
        const token = localStorage.getItem("token");

        const res = await fetch(
            "http://localhost:5000/admin/dashboard-stats",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();
        setDashboardStats(data);
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setUsers(data);
        setLoadingUsers(false);
    };

    const deleteUser = async (id: number) => {
        const token = localStorage.getItem("token");

        await fetch(`http://localhost:5000/admin/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        fetchUsers();
    };

    const kickPlayer = async (lobbyId: number, playerId: number) => {
        const token = localStorage.getItem("token");

        await fetch(
            `http://localhost:5000/admin/lobby/${lobbyId}/kick/${playerId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        fetchLobbies(); // odśwież
    };


    const [withdraws, setWithdraws] = useState<any[]>([]);
    const [loadingWithdraws, setLoadingWithdraws] = useState(false);

    const fetchWithdraws = async () => {
        try {
            setLoadingWithdraws(true);

            const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:5000/admin/withdraws", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            setWithdraws(data);

        } catch (err) {
            console.error("Błąd pobierania wypłat:", err);
        } finally {
            setLoadingWithdraws(false);
        }
    };
    const approveWithdraw = async (id: number) => {
        const token = localStorage.getItem("token");

        await fetch(`http://localhost:5000/admin/withdraws/${id}/approve`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        fetchWithdraws(); // refresh
    };
    useEffect(() => {
        if (activeView === "withdraws") {
            fetchWithdraws();
        }
    }, [activeView]);


    const renderContent = () => {
        switch (activeView) {
            case "dashboard":
                return (
                    <div className="grid grid-cols-3 gap-6">
                        <StatCard
                                title="Liczba użytkowników"
                                value={String(dashboardStats.users)}
                            />

                            <StatCard
                                title="Aktywne lobby"
                                value={String(dashboardStats.activeLobbies)}
                            />

                            <StatCard
                                title="Obrót dzienny"
                                value={`${dashboardStats.dailyTurnover} zł`}
                            />
                    </div>
                );

            case "users":
                const filteredUsers = users.filter(
                    (u) =>
                        u.nickname.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase())
                );

                return (
                    <div className="bg-slate-800 p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-4">
                            Zarządzanie użytkownikami
                        </h2>

                        <input
                            type="text"
                            placeholder="Szukaj użytkownika..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="mb-4 px-3 py-2 rounded bg-slate-700 text-white w-full"
                        />

                        {loadingUsers ? (
                            <p>Ładowanie...</p>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                <tr className="border-b border-slate-600">
                                    <th>ID</th>
                                    <th>Nickname</th>
                                    <th>Email</th>
                                    <th>Saldo</th>
                                    <th>Rola</th>
                                    <th>Akcje</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id_user}
                                        className={`border-b border-slate-700 ${
                                            user.role === "admin" ? "bg-yellow-900/20" : ""
                                        }`}
                                    >
                                        <td>{user.id_user}</td>
                                        <td>{user.nickname}</td>
                                        <td>{user.email}</td>

                                        <td>{user.saldo}</td>
                                        <td>{user.role}</td>

                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700"
                                                >
                                                    Edytuj
                                                </button>

                                                <button
                                                    disabled={user.id_user === currentUserId}
                                                    onClick={() => deleteUser(user.id_user)}
                                                    className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 disabled:opacity-40"
                                                >
                                                    Usuń
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );

            case "lobbies":
                return (
                    <div className="bg-slate-800 p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-6">
                            Zarządzanie lobby
                        </h2>

                        {/* 🔍 SEARCH + FILTER + SORT */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <input
                                type="text"
                                placeholder="Szukaj po ID"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 rounded bg-slate-700 text-white"
                            />

                            <select
                                value={filterPrivate}
                                onChange={(e) => {
                                    setFilterPrivate(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 rounded bg-slate-700 text-white"
                            >
                                <option value="all">Wszystkie</option>
                                <option value="public">Publiczne</option>
                                <option value="private">Prywatne</option>
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 rounded bg-slate-700 text-white"
                            >
                                <option value="all">Wszystkie statusy</option>
                                <option value="open">Open</option>
                                <option value="exit">Exit</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 rounded bg-slate-700 text-white"
                            >
                                <option value="id">Sortuj po ID</option>
                                <option value="players">Sortuj po liczbie graczy</option>
                                <option value="blind">Sortuj po Big Blind</option>
                            </select>
                        </div>

                        {loadingLobbies ? (
                            <p>Ładowanie lobby...</p>
                        ) : paginatedLobbies.length === 0 ? (
                            <p>Brak lobby</p>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {paginatedLobbies.map((lobby) => (
                                        <div
                                            key={lobby.id_lobby}
                                            className="bg-slate-700 p-4 rounded-lg"
                                        >
                                            <div className="flex justify-between">
                                                <div>
                                                    <p className="font-semibold">
                                                        Lobby #{lobby.id_lobby}
                                                    </p>
                                                    <p className="text-sm text-gray-300">
                                                        Gracze: {lobby.current_players}/{lobby.max_players}
                                                    </p>
                                                    <p className="text-sm text-gray-300">
                                                        Blind: {lobby.small_blind}/{lobby.big_blind}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        Status: {lobby.status}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {lobby.private ? "Prywatne" : "Publiczne"}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingLobby(lobby)}
                                                        className="bg-yellow-600 px-3 py-1 rounded hover:bg-yellow-700"
                                                    >
                                                        Edytuj
                                                    </button>

                                                    <button className="bg-red-600 px-3 py-1 rounded hover:bg-red-700">
                                                        Usuń
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 👥 LISTA GRACZY */}
                                            <div className="mt-4 bg-slate-800 p-3 rounded">
                                                <p className="text-sm font-semibold mb-2">
                                                    Gracze:
                                                </p>
                                                {lobby.players?.length ? (
                                                    <ul className="space-y-1">
                                                        {lobby.players.map((player) => (
                                                            <li
                                                                key={player.id_user}
                                                                className="flex justify-between text-sm text-gray-300"
                                                            >
                                                                <span>{player.nickname}</span>
                                                                <div className="flex gap-3 items-center">
                                                                    <span>{player.saldo} zł</span>
                                                                    <button
                                                                        onClick={() => kickPlayer(lobby.id_lobby, player.id_user)}
                                                                        className="text-red-400 hover:text-red-600"
                                                                    >
                                                                        Kick
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-500">
                                                        Brak graczy
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 📄 PAGINACJA */}
                                <div className="flex justify-center gap-2 mt-6">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40"
                                    >
                                        ←
                                    </button>

                                    <span className="px-3 py-1">
                            {currentPage} / {totalPages}
                        </span>

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        className="px-3 py-1 bg-slate-700 rounded disabled:opacity-40"
                                    >
                                        →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );

            case "withdraws":
                return (
                    <div className="bg-slate-800 p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-4">
                            Wypłaty do zatwierdzenia
                        </h2>

                        <div className="mb-4">
                            <button
                                onClick={() => setShowPaymentHistory(true)}
                                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Pokaż historię
                            </button>
                        </div>

                        {loadingWithdraws ? (
                            <p>Ładowanie...</p>
                        ) : withdraws.length === 0 ? (
                            <p>Brak oczekujących wypłat</p>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                <tr className="border-b border-slate-600">
                                    <th>ID</th>
                                    <th>Użytkownik</th>
                                    <th>Kwota</th>
                                    <th>Data</th>
                                    <th>Akcja</th>
                                </tr>
                                </thead>
                                <tbody>
                                {withdraws.map((w) => (
                                    <tr key={w.id} className="border-b border-slate-700">
                                        <td>{w.id}</td>
                                        <td>{w.nickname}</td>
                                        <td>{w.amount}</td>
                                        <td>{new Date(w.created_at).toLocaleString()}</td>
                                        <td>
                                            <button
                                                onClick={() => approveWithdraw(w.id)}
                                                className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                                            >
                                                Zatwierdź
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex">
            {/* SIDEBAR */}
            <div className="w-64 bg-slate-800 p-6 flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-8">
                        🎰 Admin Panel
                    </h1>

                    <nav className="flex flex-col gap-4">
                        <NavItem
                            label="Dashboard"
                            active={activeView === "dashboard"}
                            onClick={() => setActiveView("dashboard")}
                        />
                        <NavItem
                            label="Użytkownicy"
                            active={activeView === "users"}
                            onClick={() => setActiveView("users")}
                        />
                        <NavItem
                            label="Lobby"
                            active={activeView === "lobbies"}
                            onClick={() => setActiveView("lobbies")}
                        />
                        <NavItem
                            label="Wypłaty"
                            active={activeView === "withdraws"}
                            onClick={() => setActiveView("withdraws")}
                        />
                    </nav>
                </div>

                <button
                    onClick={onLogout}
                    className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                    Wyloguj
                </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 p-10">
                {renderContent()}
                {editingUser && (
                    <EditUserModal
                        user={editingUser}
                        onClose={() => setEditingUser(null)}
                        onSaved={() => {
                            setEditingUser(null);
                            fetchUsers();
                        }}
                    />
                )}
                {editingLobby && (
                    <EditLobbyModal
                        lobby={editingLobby}
                        onClose={() => setEditingLobby(null)}
                        onSaved={() => {
                            setEditingLobby(null);
                            fetchLobbies();
                        }}
                    />
                )}
                {showPaymentHistory && (
                    <PaymentHistoryModal
                        onClose={() => setShowPaymentHistory(false)}
                    />
                )}
            </div>
        </div>
    );
}

/* 🔹 Komponent statystyk */
function StatCard({
                      title,
                      value,
                  }: {
    title: string;
    value: string;
}) {
    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
            <p className="text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
    );
}

/* 🔹 Element nawigacji */
function NavItem({
                     label,
                     active,
                     onClick,
                 }: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`text-left px-3 py-2 rounded ${
                active ? "bg-slate-700" : "hover:bg-slate-700"
            }`}
        >
            {label}
        </button>
    );
}
