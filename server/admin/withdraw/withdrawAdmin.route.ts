import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.ts";
import {
    getPendingWithdrawsController,
    approveWithdraw,
    rejectWithdraw,
    paymentHistory
} from "./withdrawAdmin.controller.ts";

const router = Router();

router.get("/withdraws", requireAdmin, getPendingWithdrawsController);

router.post("/withdraws/:id/approve", requireAdmin, approveWithdraw);

router.post("/withdraws/:id/reject", requireAdmin, rejectWithdraw);

router.get("/payments/history", requireAdmin, paymentHistory);
export default router;