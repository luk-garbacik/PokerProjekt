import { useState, useEffect } from "react";
import { updateAdminUser } from "../api/adminUsers";

export type User = {
    id_user: number;
    nickname: string;
    email: string;
    saldo: number;
    role: "user" | "admin";
};

type Props = {
    user: User;
    onClose: () => void;
    onSaved: () => void;
};

export default function EditUserModal({
                                          user,
                                          onClose,
                                          onSaved,
                                      }: Props) {

    const [form, setForm] = useState(user);
    const [initialState] = useState(user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isDirty =
        JSON.stringify(form) !== JSON.stringify(initialState);

    const validate = () => {
        if (!form.nickname.trim()) return "Nickname jest wymagany";
        if (!form.email.includes("@")) return "Niepoprawny email";
        if (form.saldo < 0) return "Saldo nie może być ujemne";
        return "";
    };

    const handleSave = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError("");

            await updateAdminUser(user.id_user, form);

            onSaved();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (isDirty) {
            const confirm = window.confirm(
                "Masz niezapisane zmiany. Na pewno zamknąć?"
            );
            if (!confirm) return;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-2xl w-[450px] shadow-2xl space-y-6">

                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-yellow-400">
                        Edytuj użytkownika
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">

                    <InputField
                        label="Nickname"
                        value={form.nickname}
                        onChange={(v) =>
                            setForm({ ...form, nickname: v })
                        }
                    />

                    <InputField
                        label="Email"
                        value={form.email}
                        onChange={(v) =>
                            setForm({ ...form, email: v })
                        }
                    />

                    <InputField
                        label="Saldo"
                        type="number"
                        value={form.saldo}
                        onChange={(v) =>
                            setForm({ ...form, saldo: Number(v) })
                        }
                    />

                    <div>
                        <label className="text-sm text-gray-400">
                            Rola
                        </label>
                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    role: e.target.value as "user" | "admin",
                                })
                            }
                            className="w-full p-2 mt-1 rounded bg-slate-700"
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/30 p-2 rounded">
                        {error}
                    </div>
                )}

                <div className="flex justify-between pt-2">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                        Anuluj
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? "Zapisywanie..." : "Zapisz zmiany"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* 🔹 Reusable input */
function InputField({
                        label,
                        value,
                        onChange,
                        type = "text",
                    }: {
    label: string;
    value: any;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div>
            <label className="text-sm text-gray-400">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 mt-1 rounded bg-slate-700"
            />
        </div>
    );
}
