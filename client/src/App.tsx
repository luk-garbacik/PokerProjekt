        //client/src/App.tsx
        import React, { useState, useEffect } from "react";
        import { Sparkles, Trophy, Coins, Menu, User } from 'lucide-react';
        import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
        import GameLobby from "./GameLobby";
        import AdminPanel from "./AdminPanel";
        import { GameCard } from "./components/GameCard";
        import LoginModule from "./components/LoginModule";
        import RegisterModule from "./components/RegisterModule";
        import ResetModule from "./components/ResetModule";
        import ResetPassword from "./components/ResetPassword";


        type Game = {
            id: number;
            title: string;
            category: string;
            image: string;
        };

        function HomePage({
                              authView,
                              setAuthView,
                              handleLogin,
                              usersCount,
                              games,
                              resetToken
                          }: {
            authView: "login" | "register" | "reset";
            setAuthView: (v: "login" | "register" | "reset") => void;
            handleLogin: any;
            usersCount: number;
            games: Game[];
            resetToken: string | null;
        }) {
            const hasToken = new URLSearchParams(window.location.search).get("token");
            return (
                <>
                    <div className="
                        min-h-[100dvh]
                        overflow-x-hidden
                        bg-gradient-to-br
                        from-gray-900
                        via-purple-950
                        to-gray-900
                    ">
                        {/* HEADER */}
                        <header className="bg-black/30 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
                            <div className="
                                max-w-7xl
                                mx-auto
                                px-4
                                sm:px-6
                                lg:px-8
                                h-14
                                sm:h-16
                                flex
                                items-center
                                justify-between
                            ">
                                <span className="text-white text-lg sm:text-xl font-semibold">
                                    Royal Casino
                                </span>
                            </div>
                        </header>

                        {/* HERO */}
                        <section className="
                            max-w-7xl
                            mx-auto
                            px-4
                            sm:px-6
                            lg:px-8
                            py-6
                            sm:py-8
                            grid
                            grid-cols-1
                            lg:grid-cols-2
                            gap-6
                            lg:gap-10
                        ">

                            <div>
                                <h1 className="
                                    text-white
                                    text-3xl
                                    sm:text-4xl
                                    lg:text-5xl
                                    max-w-xl
                                    font-bold
                                    leading-tight
                                    mb-6
                                ">
                                    Witaj w Royal Casino
                                </h1>
                                <p className="
                                    text-gray-400
                                    text-base
                                    sm:text-lg
                                    lg:text-xl
                                    leading-relaxed
                                    max-w-2xl
                                ">
                                    Wejdź do świata Royal Casino – miejsca, gdzie adrenalina spotyka strategię.
                                    Graj przeciwko prawdziwym graczom w czasie rzeczywistym, rozwijaj swoje umiejętności
                                    i walcz o najwyższe wygrane. Blackjack, ruletka i tryby multiplayer – wszystko w jednym, dopracowanym systemie.
                                </p>
                            </div>

                            <div className="
                                flex
                                justify-center
                                lg:justify-end
                                w-full"
                            >

                                {authView === "login" && (
                                    <LoginModule
                                        onLogin={handleLogin}
                                        onSwitchToRegister={() => setAuthView("register")}
                                        onForgot={() => setAuthView("reset")}
                                    />
                                )}

                                {authView === "register" && (
                                    <RegisterModule
                                        onSuccess={() => setAuthView("login")}
                                        onBackToLogin={() => setAuthView("login")}
                                    />
                                )}

                                {authView === "reset" && !resetToken && (
                                    <ResetModule onBack={() => setAuthView("login")} />
                                )}

                                {authView === "reset" && resetToken && (
                                    <ResetPassword
                                        onBack={() => setAuthView("login")}
                                        token={resetToken}
                                    />
                                )}

                            </div>
                        </section>

                        {/* STATS SECTION */}
                        <section className="w-full flex justify-center py-8">
                            <div className="max-w-5xl w-full px-4">

                                <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">

                                    {/* CARD 1 */}
                                    <div className="
                                        bg-gray-800/30
                                        backdrop-blur-sm
                                        border
                                        border-gray-700/50
                                        rounded-lg
                                        p-3
                                        sm:p-8
                                        transition-all
                                        duration-300
                                        active:scale-[0.98]
                                        md:hover:scale-105
                                    ">
                                        <Trophy className="text-yellow-500 mx-auto mb-2 sm:mb-4 w-7 h-7 sm:w-11 sm:h-11" />

                                        <div className="
                                            text-white
                                            text-2xl
                                            sm:text-4xl
                                            font-bold
                                            mb-1
                                            sm:mb-2
                                        ">
                                            3
                                        </div>

                                        <div className="
                                            text-gray-400
                                            text-xs
                                            sm:text-base
                                            leading-tight
                                        ">
                                            Dostępne gry
                                        </div>
                                    </div>

                                    {/* CARD 2 */}
                                    <div className="
                                        bg-gray-800/30
                                        backdrop-blur-sm
                                        border
                                        border-gray-700/50
                                        rounded-lg
                                        p-3
                                        sm:p-8
                                        transition-all
                                        duration-300
                                        active:scale-[0.98]
                                        md:hover:scale-105
                                    ">
                                        <User className="text-purple-500 mx-auto mb-2 sm:mb-4 w-7 h-7 sm:w-11 sm:h-11" />

                                        <div className="
                                            text-white
                                            text-2xl
                                            sm:text-4xl
                                            font-bold
                                            mb-1
                                            sm:mb-2
                                        ">
                                            {usersCount}
                                        </div>

                                        <div className="
                                            text-gray-400
                                            text-xs
                                            sm:text-base
                                            leading-tight
                                        ">
                                            Aktywni gracze
                                        </div>
                                    </div>

                                    {/* CARD 3 */}
                                    <div className="
                                        bg-gray-800/30
                                        backdrop-blur-sm
                                        border
                                        border-gray-700/50
                                        rounded-lg
                                        p-3
                                        sm:p-8
                                        transition-all
                                        duration-300
                                        active:scale-[0.98]
                                        md:hover:scale-105
                                    ">
                                        <Coins className="text-green-500 mx-auto mb-2 sm:mb-4 w-7 h-7 sm:w-11 sm:h-11" />

                                        <div className="
                                            text-white
                                            text-2xl
                                            sm:text-4xl
                                            font-bold
                                            mb-1
                                            sm:mb-2
                                        ">
                                            24/7
                                        </div>

                                        <div className="
                                            text-gray-400
                                            text-xs
                                            sm:text-base
                                            leading-tight
                                        ">
                                            Wsparcie
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </section>

                        {/* GAMES */}
                        <section className="max-w-7xl mx-auto px-2 sm:px-4 py-8">
                            <h2 className="text-white text-xl sm:text-2xl mb-4 sm:mb-6">Popularne gry</h2>

                            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 w-full distribution-fix">
                                {games.map((g: Game) => (
                                    <GameCard key={g.id} {...g} />
                                ))}
                            </div>
                        </section>
                        {/* Footer */}
                        <footer className="text-center py-4 text-gray-400 border-t border-gray-700">
                            © 2025 Poker Royale. All rights reserved.
                        </footer>
                    </div>
                </>
            );
        }

        export default function App() {
            const navigate = useNavigate();

            const [usersCount, setUsersCount] = useState<number>(0);

            const [nickname, setNickname] = useState<string | null>(null);
            const [saldo, setSaldo] = useState<number>(0);
            const [userId, setUserId] = useState<number | null>(null);
            const [role, setRole] = useState<string | null>(null);

            const [authView, setAuthView] = useState<"login" | "register" | "reset">("login");
            const [resetToken, setResetToken] = useState<string | null>(null);

            useEffect(() => {
                fetch("http://localhost:5000/api/users/count")
                    .then(res => res.json())
                    .then(data => {
                        setUsersCount(data.count);
                    })
                    .catch(err => console.error("Błąd pobierania usersCount:", err));
            }, []);

            const [authReady, setAuthReady] = useState(false);

            useEffect(() => {
                const storedNickname = localStorage.getItem("nickname");
                const storedSaldo = localStorage.getItem("saldo");
                const storedUserId = localStorage.getItem("userId");
                const storedRole = localStorage.getItem("role");

                if (storedNickname && storedUserId) {
                    setNickname(storedNickname);
                    setSaldo(storedSaldo ? parseFloat(storedSaldo) : 0);
                    setUserId(parseInt(storedUserId));
                    setRole(storedRole || "user");

                    if (storedRole === "admin") {
                        navigate("/admin");
                    } else {
                        navigate("/lobby");
                    }
                }
                setAuthReady(true);
            }, []);

            useEffect(() => {
                const params = new URLSearchParams(window.location.search);
                const tokenFromUrl = params.get("token");

                if (tokenFromUrl) {
                    // setResetToken(token);
                    setResetToken(tokenFromUrl); //poprawne
                    setAuthView("reset");       //poprawne

                    // Czyścimy pasek adresu, aby link był "jednorazowy" wizualnie
                    window.history.replaceState({}, "", "/"); //poprawne
                }
            }, []);

            const handleLogin = (
                nick: string,
                saldo: number = 0,
                id?: number,
                role?: string,
                token?: string
            ) => {
                setNickname(nick);
                setSaldo(saldo);
                setUserId(id ?? 0);
                setRole(role || "user");

                if (token) localStorage.setItem("token", token);

                localStorage.setItem("nickname", nick);
                localStorage.setItem("saldo", saldo.toString());
                if (id !== undefined) localStorage.setItem("userId", id.toString());
                localStorage.setItem("role", role || "user");

                // 🔥 NAJWAŻNIEJSZE
                if (role === "admin") {
                    navigate("/admin");
                } else {
                    navigate("/lobby");
                }
            };

            const handleLogout = () => {
                setNickname(null);
                setSaldo(0);
                setUserId(null);
                setRole(null);
                localStorage.clear();

                navigate("/");
            };


            const games = [
                {
                    id: 1,
                    title: "Kasyno Multiplayer",
                    category: "Multiplayer",
                    image: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=600",
                },
                {
                    id: 2,
                    title: "Ruletka",
                    category: "Klasyczne gry",
                    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=600",
                },
                {
                    id: 3,
                    title: "Blackjack",
                    category: "Gry karciane",
                    image: "https://images.unsplash.com/photo-1541278107931-e006523892df?w=600",
                },
            ];

            return (
                <Routes>

                    {/* HOME */}
                    <Route
                        path="/"
                        element={
                            <HomePage
                                authView={authView}
                                setAuthView={setAuthView}
                                handleLogin={handleLogin}
                                usersCount={usersCount}
                                games={games}
                                resetToken={resetToken}
                            />
                        }
                    />

                    <Route
                        path="/reset-password"
                        element={
                            <Navigate
                                // to="/"
                                to={{ pathname: "/", search: window.location.search }}
                                replace
                            />
                        }
                    />

                    <Route
                        path="/lobby/:lobbyId?"
                        element={
                            !authReady ? (
                                    <div>Loading...</div> // 🔥 blokuje render zanim stan gotowy
                                ) : nickname && userId ? (
                                <GameLobby
                                    userId={userId}
                                    nickname={nickname}
                                    saldo={saldo}
                                    onLogout={handleLogout}
                                    view="poker"
                                />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />

                    {/* ADMIN */}
                    <Route
                        path="/admin"
                        element={
                            nickname && role === "admin" ? (
                                <AdminPanel onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />

                    <Route
                        path="/ruletka"
                        element={
                            nickname && userId ? (
                                <GameLobby
                                    userId={userId}
                                    nickname={nickname}
                                    saldo={saldo}
                                    onLogout={handleLogout}
                                    view="ruletka"
                                />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />

                    <Route
                        path="/blackjack"
                        element={
                            nickname && userId ? (
                                <GameLobby
                                    userId={userId}
                                    nickname={nickname}
                                    saldo={saldo}
                                    onLogout={handleLogout}
                                    view="blackjack"
                                />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />

                </Routes>
            );
        }
