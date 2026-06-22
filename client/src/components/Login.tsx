// client/src/Login.tsx
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
  onResetPassword: () => void;
  onRegister: () => void;
  onClose: () => void;
};

export default function Login({
                                onLogin,
                                onResetPassword,
                                onRegister,
                                onClose,
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
        body: JSON.stringify({ nickname, password, captchaToken }),
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
        onClose();
      } else {
        setError(data.error || "Nieprawidłowe dane logowania");
        setPassword("");
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } catch {
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          p-4
          bg-black/70
          backdrop-blur-sm
      ">
        <div className="
            relative
            w-full
            max-w-md
            shadow-2xl
            bg-gradient-to-br
            from-gray-900
            via-purple-900/40
            to-gray-900
            rounded-2xl
            p-5
            sm:p-8
            border
            border-purple-500/20
        ">

          {/* ❌ CLOSE */}
          <button
              onClick={onClose}
              className="
                  absolute
                  top-4
                  right-4
                  text-gray-400
                  hover:text-white
                  transition-colors
                  text-xl
                  w-8
                  h-8
                  flex
                  items-center
                  justify-center
              "
          >
            ✕
          </button>

          <h2 className="
              text-white
              text-2xl
              sm:text-3xl
              font-bold
              text-center
              mb-6
          ">
            Logowanie
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
                    border
                    border-transparent
                    focus:outline-none
                    focus:ring-2
                    focus:ring-purple-500
                    focus:border-purple-500
                "
            />

            {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <div className="
                flex
                justify-center
                overflow-hidden
                overflow-x-auto
                scale-90
                sm:scale-100
                origin-center
            ">
              <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LcuynwsAAAAAKSR-nzQFkOu9MPK9QgjWzhvkAZg"
                  onChange={(token) => setCaptchaToken(token)}
              />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="
                    bg-purple-600
                    hover:bg-purple-700
                    active:scale-[0.98]
                    transition-all
                    duration-200
                    text-white
                    p-3
                    rounded-lg
                    font-medium
                    disabled:opacity-50
                "
            >
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>

            <div className="text-center flex flex-col gap-2 mt-2">
              <button
                  type="button"
                  onClick={onResetPassword}
                  className="
                      text-purple-400
                      text-sm
                      hover:text-purple-300
                      transition-colors
                  "
              >
                Zapomniałeś hasła?
              </button>

              <button
                  type="button"
                  onClick={onRegister}
                  className="
                      text-gray-300
                      text-sm
                      hover:text-white
                      transition-colors
                  "
              >
                Nie masz konta? Zarejestruj się
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
