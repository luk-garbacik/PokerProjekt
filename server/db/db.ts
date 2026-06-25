// server/db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.PGUSER || 'poker_user',       // Twój użytkownik PostgreSQL
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pokerdb',    // Docelowa baza danych
  password: process.env.PGPASSWORD || 'poker_password',      // Hasło do użytkownika
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// Funkcja pomocnicza do testowania połączenia
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Połączono z bazą danych!');
    client.release();
  } catch (err) {
    console.error('Błąd połączenia z bazą danych:', err);
  }
}
