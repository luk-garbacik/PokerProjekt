import React, { useState, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

type Props = {
    onLogin: (
        nickname: string,
        saldo?: number,
        userId?: number,
        role?: string,
        token?: string
    ) => void;
    onSwitchToRegister: () => void;
    onForgot: () => void;
};

export default function LoginModule({
                                        onLogin,
                                        onSwitchToRegister,
                                        onForgot,
                                    }: Props) {
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!captchaToken) {
            setError("Potwierdź, że nie jesteś robotem");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nickname,
                    password,
                    captchaToken,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                onLogin(
                    nickname,
                    data.saldo,
                    data.userId,
                    data.role,
                    data.token
                );
            } else {
                setError(data.error || "Nieprawidłowe dane logowania");

                // 🔥 reset hasła + captcha jak w Login.tsx
                setPassword("");
                recaptchaRef.current?.reset();
                setCaptchaToken(null);
            }
        } catch {
            setError("Błąd połączenia z serwerem");

            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="
            bg-gray-900/50
            backdrop-blur-sm
            border
            border-gray-800
            rounded-2xl
            p-4
            sm:p-8
            w-full
            max-w-[340px]
            sm:max-w-md
            shadow-2xl
        ">

            <h2 className="
                text-white
                text-2xl
                sm:text-3xl
                font-bold
                mb-6
                text-center
            ">
                Zaloguj się
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <input
                    type="text"
                    placeholder="Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                    className="
                        p-3
                        rounded-lg
                        bg-white/10
                        text-white
                        text-base
                        placeholder-gray-400
                        border
                        border-transparent
                        focus:outline-none
                        focus:ring-2
                        focus:ring-purple-500
                        focus:border-purple-500
                    "
                />

                <input
                    type="password"
                    placeholder="Hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="
                        p-3
                        rounded-lg
                        bg-white/10
                        text-white
                        text-base
                        placeholder-gray-400
                        border
                        border-transparent
                        focus:outline-none
                        focus:ring-2
                        focus:ring-purple-500
                        focus:border-purple-500
                    "
                />

                {error && (
                    <div className="text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* 🔐 CAPTCHA */}
                <div className="
                    flex
                    justify-center
                    w-full
                    overflow-hidden
                    scale-[0.80]
                    sm:scale-100
                    origin-center
                    my-1
                ">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey="6LcuynwsAAAAAKSR-nzQFkOu9MPK9QgjWzhvkAZg"
                        onChange={(token) => setCaptchaToken(token)}
                        onExpired={() => {
                            setCaptchaToken(null);
                            setError("Captcha wygasła. Zaznacz ponownie.");
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="
                        bg-gradient-to-r
                        from-purple-600
                        to-pink-600
                        hover:from-purple-700
                        hover:to-pink-700
                        active:scale-[0.98]
                        transition-all
                        duration-200
                        text-white
                        p-3
                        rounded-lg
                        font-medium
                        shadow-lg
                        disabled:opacity-50
                    "
                >
                    {loading ? "Logowanie..." : "Zaloguj się"}
                </button>

            </form>

            <div className="text-center mt-4 flex flex-col gap-2">

                <button
                    onClick={onForgot}
                    className="
                        text-purple-400
                        hover:text-purple-300
                        transition-colors
                        text-sm
                        py-1
                    "
                >
                    Zapomniałeś hasła?
                </button>

                <button
                    onClick={onSwitchToRegister}
                    className="
                        text-gray-300
                        hover:text-white
                        transition-colors
                        text-sm
                        py-1
                    "
                >
                    Nie masz konta? Zarejestruj się
                </button>

            </div>
        </div>
    );
}
