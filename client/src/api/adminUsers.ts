export async function updateAdminUser(
    id: number,
    data: any
) {
    const token = localStorage.getItem("token");

    const res = await fetch(
        `http://localhost:5000/admin/users/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        }
    );

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Błąd aktualizacji");
    }

    return res.json();
}
