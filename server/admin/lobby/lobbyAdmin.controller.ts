import type { Request, Response } from "express";
import {
    kickPlayer,updateLobby
} from "./lobbyAdmin.service.ts";

export async function kickPlayerController(req: Request, res: Response) {
    try {
        const lobbyId = Number(req.params.lobbyId);
        const playerId = Number(req.params.playerId);

        const result = await kickPlayer(lobbyId, playerId);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}

export async function updateLobbyController(req: Request, res: Response) {
    try {
        const lobbyId = Number(req.params.lobbyId);
        const data = req.body;

        const result = await updateLobby(lobbyId, data);

        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
}
