//rouletteWinner.ts

import { pool } from "../db/db.ts";

export async function payoutRouletteBets(bets: any[], result: number, color: string) {
    const updatedUsers = new Set<number>();

    for (const b of bets) {
        let winAmount = 0;

        // --- kolory ---
        if (b.bet_type === "color") {
            const expected =
                color === "red" ? 1 :
                color === "black" ? 2 :
                0;

            if (b.bet_value === expected) {
                winAmount = b.amount * 2;
            }
        }

        // --- liczby ---
        if (b.bet_type === "number" && b.bet_value === result) {
            winAmount = b.amount * 36;
        }

        // --- parzyste / nieparzyste ---
        if (b.bet_type === "parity" && result!=0) {
            const isEven = result % 2 === 0;
            const expected = isEven ? 1 : 2;

            if (b.bet_value === expected) {
                winAmount = b.amount * 2;
            }
        }

        // == POLOWY ==
        if (b.bet_type === "1to18") {
            const isFirstHalf = result >= 1 && result <= 18;   // 1–18
            const expected = isFirstHalf ? 1 : 2;              // 1 = firstHalf, 2 = secondHalf

            if (b.bet_value === expected) {
                winAmount = b.amount * 2;
            }
        }

        // --- TUZINY ---
        if (b.bet_type === "dozen" && result !== 0) {
            const dozen =
                result <= 12 ? 1 :
                    result <= 24 ? 2 :
                        3;

            if (b.bet_value === dozen) {
                winAmount = b.amount * 3; // 2:1
            }
        }

        // --- KOLUMNY (2to1) ---
        if (b.bet_type === "column" && result !== 0) {
            const column =
                result % 3 === 1 ? 1 :
                    result % 3 === 2 ? 2 :
                        3;

            if (b.bet_value === column) {
                winAmount = b.amount * 3; // 2:1
            }
        }


        // wypłata
        if (winAmount > 0) {
            await pool.query(
                `UPDATE users SET saldo = saldo + $1 WHERE id_user = $2`,
                [winAmount, b.id_user]
            );
            updatedUsers.add(b.id_user);
        }
    }
    return [...updatedUsers];
}
