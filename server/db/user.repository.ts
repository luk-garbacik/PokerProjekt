// server/repositories/user.repository.ts
import { pool } from "./db.ts";

export async function getUsersCount(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*) FROM users");
    return parseInt(result.rows[0].count, 10);
}