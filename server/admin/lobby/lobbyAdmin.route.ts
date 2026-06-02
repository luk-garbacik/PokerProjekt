// server/admin/lobbyAdmin.routes.ts

import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.ts";
import { kickPlayerController, updateLobbyController } from "./lobbyAdmin.controller.ts";

const router = Router();

router.post(
    "/lobby/:lobbyId/kick/:playerId",
    requireAdmin,
    kickPlayerController
);

router.put(
    "/lobby/:lobbyId",
    requireAdmin,
    updateLobbyController
);

export default router;
