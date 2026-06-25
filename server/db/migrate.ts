// server/db/migrate.ts
import { Pool } from 'pg';

async function migrate() {
  // Pobieramy dane ze zmiennych środowiskowych (wstrzykiwanych przez Docker)
  // z domyślnymi wartościami identycznymi jak w db.ts
  const user = process.env.PGUSER || 'poker_user';
  const host = process.env.PGHOST || 'db'; // W sieci dockerowej hostem jest nazwa usługi, czyli 'db'
  const database = process.env.PGDATABASE || 'pokerdb'; // spójna nazwa bez podkreślenia
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
    console.log(`Rozpoczynanie migracji na bazie danych: ${database}...`);

    // 1. Tworzenie tabeli użytkowników
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id_user SERIAL PRIMARY KEY,
        nickname VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        saldo NUMERIC DEFAULT 0,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT
        );
    `);
    console.log('Tabela users utworzona!');

    // Dodawanie brakujących kolumn
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);

    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_token TEXT,
        ADD COLUMN IF NOT EXISTS reset_token_expire TIMESTAMP;
    `);

    await pool.query(`
    DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'users_role_check'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT users_role_check
          CHECK (role IN ('user', 'admin'));
        END IF;
      END
    $$;
  `);

    await pool.query(`
      DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='users'
              AND column_name='email'
              AND is_nullable='YES'
          ) THEN
            ALTER TABLE users ALTER COLUMN email SET NOT NULL;
          END IF;
        END
      $$;
    `);

    await pool.query(`
      DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'users_email_unique'
          ) THEN
            ALTER TABLE users
            ADD CONSTRAINT users_email_unique UNIQUE (email);
          END IF;
        END
      $$;
    `);

    // 2. Tworzenie tabeli poker_lobby
    await pool.query(`
      CREATE TABLE IF NOT EXISTS poker_lobby (
        id_lobby SERIAL PRIMARY KEY,
        max_players INT NOT NULL,
        current_players INT DEFAULT 0,
        small_blind NUMERIC NOT NULL,
        big_blind NUMERIC NOT NULL,
        entry_fee NUMERIC GENERATED ALWAYS AS (big_blind * 25) STORED,
        status VARCHAR(20) DEFAULT 'open',
        private BOOLEAN DEFAULT FALSE,
        password VARCHAR(6),
        owner_id INT REFERENCES users(id_user) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela poker_lobby utworzona!');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_lobby (
        player_id INT REFERENCES users(id_user) PRIMARY KEY,
        lobby_id INT REFERENCES poker_lobby(id_lobby),
        joined_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela player_lobby utworzona!');

    // 3. Tabela rund ruletki
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roulette_rounds (
        id SERIAL PRIMARY KEY,
        result_number INT,
        result_color VARCHAR(10),
        result_parity VARCHAR(10),
        result_1to18 VARCHAR(10),
        liczba_zakladow INT DEFAULT 0,
        pula NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela roulette_rounds utworzona!');

    // 4. Tabela zakładów
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roulette_bets (
        id SERIAL PRIMARY KEY,
        round_id INT REFERENCES roulette_rounds(id) ON DELETE CASCADE,
        id_user INT REFERENCES users(id_user) ON DELETE CASCADE,
        bet_type VARCHAR(20) NOT NULL,
        bet_value INT,
        amount NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabela roulette_bets utworzona!');

    // 5. Tabela transakcji
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id_user) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        amount NUMERIC NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        provider VARCHAR(20) DEFAULT 'sandbox',
        external_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
        );
    `);
    console.log('Tabela transakcji utworzona!');

    await pool.end();
    console.log('Migracja zakończona sukcesem!');
  } catch (err) {
    console.error('Błąd migracji:', err);
    process.exit(1); // ONA PRZERYWA PROCES, dzięki czemu skrypt startowy nie przejdzie dalej w razie awarii
  }
}

migrate();