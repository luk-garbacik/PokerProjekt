import {pool} from "../../db/db.ts";

export async function getPendingWithdraws() {

    const result = await pool.query(`
 SELECT
   t.id,
   u.nickname,
   t.amount,
   t.status,
   t.created_at
 FROM transactions t
 JOIN users u ON u.id_user = t.user_id
 WHERE t.type='withdraw'
 AND t.status='pending'
 ORDER BY t.created_at ASC
 `);

    return result.rows;
}