// server/seed.ts
import { Pool } from "pg";
import bcrypt from "bcrypt";

async function seed() {
  const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "pokerdb",
    password: "admin",
    port: 5432,
  });

  try {
    const plainPassword = "admin123"; // jedno hasło dla wszystkich
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
  }
}

seed();