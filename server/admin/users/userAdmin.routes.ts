import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.ts";
import {
    getUsersController,
    deleteUserController,
    updateUserController
} from "./userAdmin.controller.ts";

const router = Router();

router.get("/users", requireAdmin, getUsersController);
router.delete("/users/:id", requireAdmin, deleteUserController);
router.put("/users/:id", requireAdmin, updateUserController);

export default router;