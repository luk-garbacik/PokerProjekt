import { Pool } from 'pg';

async function migrate() {
  try {
    // 1. Połączenie do domyślnej bazy postgres, żeby ewentualnie utworzyć pokerdb
    const defaultPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: 'admin',
      port: 5432,
    });

    try {
      await defaultPool.query('CREATE DATABASE pokerdb');
      console.log('Baza pokerdb utworzona!');
    } catch (err: any) {
      if (err.code === '42P04') {
        console.log('Baza pokerdb już istnieje, kontynuuję...');
      } else {
        throw err;
      }
    }
    await defaultPool.end();

    // 2. Połączenie do docelowej bazy pokerdb
    const pool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'pokerdb',
      password: 'admin',
      port: 5432,
    });

    // 3. Tworzenie tabeli użytkowników
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

    console.log('Tabela uzytkownicy utworzona!');

    // Kolumny
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email VARCHAR(100),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Dodanie kolumny role
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);

    // Kolumny do resetu hasła
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
    // Constraint
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

    // 4. Tworzenie tabeli poker_lobby
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

 // 5. Tabela rund ruletki
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

    // 6. Tabela zakładów
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
    console.log('Tabela bets utworzona!');

    // 6. Tabela tranzakcji
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id_user) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL, -- deposit / withdraw
        amount NUMERIC NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- pending/completed/failed
        provider VARCHAR(20) DEFAULT 'sandbox',
        external_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
        );
    `);
    console.log('Tabela tranzakcji utworzona!');

    await pool.end();
    
    console.log('Migracja zakończona sukcesem!');
  } catch (err) {
    console.error('Błąd migracji:', err);
  }

  
}

migrate();

