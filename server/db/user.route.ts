// server/routes/users.ts
import { Router } from "express";
import { getUsersCount } from "./user.repository.ts";

const router = Router();

router.get("/count", async (req, res) => {
    try {
        const count = await getUsersCount();
        res.json({ count });
    } catch (err) {
        console.error("Błąd pobierania liczby użytkowników:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;