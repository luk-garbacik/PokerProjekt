import { pool } from "../../db/db.ts";

export async function getUsers() {
    const result = await pool.query(`
        SELECT id_user, nickname, email, saldo, role, created_at
        FROM users
        ORDER BY id_user ASC
    `);

    return result.rows;
}

export async function deleteUser(id: number) {
    await pool.query("DELETE FROM users WHERE id_user = $1", [id]);
}

export async function updateUser(
    id: number,
    data: { role?: string }
) {
    await pool.query(
        `UPDATE users
         SET role = COALESCE($1, role)
         WHERE id_user = $2`,
        [data.role ?? null, id]
    );

    return { message: "User updated" };
}