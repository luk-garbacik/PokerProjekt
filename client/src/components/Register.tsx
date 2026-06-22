// client/src/Register.tsx

import React, { useState } from "react";

type Props = {
  onRegister: () => void;
  onLogin: () => void;
  onClose: () => void;
};

export default function Register({ onRegister, onLogin, onClose }: Props) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
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
        setSuccess("Konto utworzone!");
        setTimeout(() => {
          onRegister();
          onClose();
        }, 1000);
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
            bg-gradient-to-br
            from-gray-900
            via-purple-900/40
            to-gray-900
            rounded-2xl
            p-5
            sm:p-8
            border
            border-purple-500/20
            shadow-2xl
        ">
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
            Rejestracja
          </h2>

          <form onSubmit={handleRegister} className="flex flex-col mt-2 gap-4">

            <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required className="
    p-3
    bg-white/10
    text-white
    text-base
    rounded-lg
    placeholder-gray-400
    border
    border-transparent
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:border-purple-500
" />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="
    p-3
    bg-white/10
    text-white
    text-base
    rounded-lg
    placeholder-gray-400
    border
    border-transparent
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:border-purple-500
" />
            <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} className="
    p-3
    bg-white/10
    text-white
    text-base
    rounded-lg
    placeholder-gray-400
    border
    border-transparent
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:border-purple-500
"/>
            <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} required className="
    p-3
    bg-white/10
    text-white
    text-base
    rounded-lg
    placeholder-gray-400
    border
    border-transparent
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:border-purple-500
" />
            <input type="password" placeholder="Powtórz hasło" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="
    p-3
    bg-white/10
    text-white
    text-base
    rounded-lg
    placeholder-gray-400
    border
    border-transparent
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:border-purple-500
" />

            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            {success && <div className="text-green-400 text-sm text-center">{success}</div>}

            <button className="
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
">
              {loading ? "Tworzenie..." : "Zarejestruj"}
            </button>

            <button type="button" onClick={onLogin} className="
    text-gray-300
    hover:text-white
    transition-colors
    text-sm
    py-1
">
              Masz konto? Zaloguj się
            </button>

          </form>
        </div>
      </div>
  );
}