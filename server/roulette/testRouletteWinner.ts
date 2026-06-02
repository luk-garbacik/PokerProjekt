/* testPokerWinner.ts
   Testy payoutRouletteBets – wszystkie scenariusze wygranych
*/

type Bet = {
    id_user: number;
    bet_type: string;
    bet_value: number;
    amount: number;
};

function simulatePayout(bets: Bet[], result: number, color: string) {
    const payouts: Record<number, number> = {};

    for (const b of bets) {
        let winAmount = 0;

        // --- COLOR ---
        if (b.bet_type === "color") {
            const expected =
                color === "red" ? 1 :
                    color === "black" ? 2 : 0;

            if (b.bet_value === expected) {
                winAmount = b.amount * 2;
            }
        }

        // --- NUMBER ---
        if (b.bet_type === "number" && b.bet_value === result) {
            winAmount = b.amount * 36;
        }

        // --- PARITY ---
        if (b.bet_type === "parity" && result !== 0) {
            const expected = result % 2 === 0 ? 1 : 2;
            if (b.bet_value === expected) {
                winAmount = b.amount * 2;
            }
        }

        // --- 1to18 ---
        if (b.bet_type === "1to18") {
            const expected = result <= 18 ? 1 : 2;
            if (b.bet_value === expected) {
                winAmount = b.amount * 2;
            }
        }

        // --- DOZEN ---
        if (b.bet_type === "dozen" && result !== 0) {
            const dozen = result <= 12 ? 1 : result <= 24 ? 2 : 3;
            if (b.bet_value === dozen) {
                winAmount = b.amount * 3;
            }
        }

        // --- COLUMN ---
        if (b.bet_type === "column" && result !== 0) {
            const column =
                result % 3 === 1 ? 1 :
                    result % 3 === 2 ? 2 : 3;

            if (b.bet_value === column) {
                winAmount = b.amount * 3;
            }
        }

        if (winAmount > 0) {
            payouts[b.id_user] = (payouts[b.id_user] || 0) + winAmount;
        }
    }

    return payouts;
}

function logScenario(title: string, result: number, color: string, bets: Bet[]) {
    console.log("\n===============================");
    console.log(`🎰 SCENARIUSZ: ${title}`);
    console.log(`➡️  WYNIK: ${result} (${color})`);
    console.log("📥 ZAKŁADY:");

    bets.forEach(b =>
        console.log(
            `   Gracz ${b.id_user}: ${b.bet_type}=${b.bet_value}, stawka=${b.amount}`
        )
    );

    const payouts = simulatePayout(bets, result, color);

    console.log("💰 WYPŁATY:");
    if (Object.keys(payouts).length === 0) {
        console.log("   ❌ Brak wygranych");
    } else {
        Object.entries(payouts).forEach(([uid, amt]) =>
            console.log(`   ✅ Gracz ${uid} wygrywa ${amt}`)
        );
    }
}

/* ==============================
   SCENARIUSZE
================================ */

// COLOR
logScenario("KOLOR – RED", 7, "red", [
    { id_user: 1, bet_type: "color", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "color", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 7, amount: 5 },
]);

// NUMBER
logScenario("LICZBA", 17, "black", [
    { id_user: 1, bet_type: "number", bet_value: 17, amount: 5 },
    { id_user: 2, bet_type: "number", bet_value: 12, amount: 5 },
    { id_user: 3, bet_type: "color", bet_value: 2, amount: 10 },
]);

// PARITY
logScenario("PARZYSTE", 18, "red", [
    { id_user: 1, bet_type: "parity", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "parity", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 18, amount: 2 },
]);

// 1to18
logScenario("POŁOWY – 1–18", 9, "red", [
    { id_user: 1, bet_type: "1to18", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "1to18", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 9, amount: 3 },
]);

// DOZEN
logScenario("TUZINY – 2nd 12", 20, "black", [
    { id_user: 1, bet_type: "dozen", bet_value: 2, amount: 10 },
    { id_user: 2, bet_type: "dozen", bet_value: 1, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 20, amount: 1 },
]);

// COLUMN
logScenario("KOLUMNY – column 2", 14, "red", [
    { id_user: 1, bet_type: "column", bet_value: 2, amount: 10 },
    { id_user: 2, bet_type: "column", bet_value: 1, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 14, amount: 1 },
]);

// ZERO
logScenario("ZERO – brak wygranych poza liczbą", 0, "green", [
    { id_user: 1, bet_type: "color", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "parity", bet_value: 1, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 0, amount: 2 },
]);
logScenario("MULTI WIN – kolor + parzyste", 8, "black", [
    { id_user: 1, bet_type: "color", bet_value: 2, amount: 10 },   // black
    { id_user: 1, bet_type: "parity", bet_value: 1, amount: 10 },  // even
    { id_user: 2, bet_type: "number", bet_value: 8, amount: 1 },
]);
logScenario("STACK – number + dozen + column", 17, "black", [
    { id_user: 1, bet_type: "number", bet_value: 17, amount: 1 },
    { id_user: 1, bet_type: "dozen", bet_value: 2, amount: 5 },
    { id_user: 1, bet_type: "column", bet_value: 2, amount: 5 },
]);
logScenario("ALL LOSE", 11, "black", [
    { id_user: 1, bet_type: "color", bet_value: 1, amount: 10 },   // red
    { id_user: 2, bet_type: "parity", bet_value: 1, amount: 10 },  // even
    { id_user: 3, bet_type: "1to18", bet_value: 2, amount: 10 },   // 19–36
]);
logScenario("ZERO – tylko number", 0, "green", [
    { id_user: 1, bet_type: "number", bet_value: 0, amount: 2 },
    { id_user: 2, bet_type: "parity", bet_value: 1, amount: 10 },
    { id_user: 3, bet_type: "dozen", bet_value: 1, amount: 10 },
]);
logScenario("TUZIN – granica 12", 12, "red", [
    { id_user: 1, bet_type: "dozen", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "dozen", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 12, amount: 1 },
]);

logScenario("TUZIN – granica 13", 13, "black", [
    { id_user: 1, bet_type: "dozen", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "dozen", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 13, amount: 1 },
]);
logScenario("POŁOWY – 18", 18, "red", [
    { id_user: 1, bet_type: "1to18", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "1to18", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 18, amount: 1 },
]);

logScenario("POŁOWY – 19", 19, "red", [
    { id_user: 1, bet_type: "1to18", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "1to18", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "number", bet_value: 19, amount: 1 },
]);
logScenario("COLUMN 1", 13, "black", [
    { id_user: 1, bet_type: "column", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "column", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "column", bet_value: 3, amount: 10 },
]);

logScenario("COLUMN 2", 14, "red", [
    { id_user: 1, bet_type: "column", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "column", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "column", bet_value: 3, amount: 10 },
]);

logScenario("COLUMN 3", 15, "black", [
    { id_user: 1, bet_type: "column", bet_value: 1, amount: 10 },
    { id_user: 2, bet_type: "column", bet_value: 2, amount: 10 },
    { id_user: 3, bet_type: "column", bet_value: 3, amount: 10 },
]);
logScenario("MULTI SAME BET TYPE", 6, "black", [
    { id_user: 1, bet_type: "parity", bet_value: 1, amount: 5 },
    { id_user: 1, bet_type: "parity", bet_value: 1, amount: 5 },
    { id_user: 2, bet_type: "number", bet_value: 6, amount: 1 },
]);
