// server/db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',       // Twój użytkownik PostgreSQL
  host: 'localhost',      
  database: 'pokerdb',    // Docelowa baza danych
  password: 'admin',      // Hasło do użytkownika
  port: 5432,
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
