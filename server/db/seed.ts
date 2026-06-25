// server/db/seed.ts
import { Pool } from "pg";
import bcrypt from "bcrypt";

async function seed() {
  const user = process.env.PGUSER || 'poker_user';
  const host = process.env.PGHOST || 'db';
  const database = process.env.PGDATABASE || 'pokerdb';
  const password = process.env.PGPASSWORD || 'poker_password';
  const port = parseInt(process.env.PGPORT || '5432', 10);

  const pool = new Pool({
    user,
    host,
    database,
    password,
    port,
  });

  try {
    const plainPassword = "admin123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 👑 ADMIN
    await pool.query(
        `
      INSERT INTO users
      (nickname, email, password, saldo, role, email_verified)
      VALUES ($1, $2, $3, 1000, 'admin', true)
      ON CONFLICT (nickname) DO NOTHING
      `,
        ["lukaszAdmin", "admin@poker.pl", hashedPassword]
    );

    // 👤 USERS
    const users = ["lukasz1", "lukasz2", "lukasz3"];

    for (let i = 0; i < users.length; i++) {
      await pool.query(
          `
        INSERT INTO users
        (nickname, email, password, saldo, role, email_verified)
        VALUES ($1, $2, $3, 500, 'user', true)
        ON CONFLICT (nickname) DO NOTHING
        `,
          [users[i], `${users[i]}@poker.pl`, hashedPassword]
      );
    }

    console.log("Konta użytkowników dodane!");

    // 🎲 Lobby
    await pool.query(`
      INSERT INTO poker_lobby
      (max_players, current_players, small_blind, big_blind, private, password, owner_id)
      VALUES
        (6, 0, 5, 10, FALSE, NULL, NULL),
        (4, 0, 2, 4, FALSE, NULL, NULL),
        (5, 0, 1, 2, TRUE, '123456', NULL),
        (8, 0, 10, 20, FALSE, NULL, NULL)
    `);

    console.log("Seeder zakończony sukcesem!");
    await pool.end();
  } catch (err) {
    console.error("Błąd seedowania:", err);
    process.exit(1); // Blokuje dalsze wykonywanie skryptów w package.json w razie błędu
  }
}

seed();