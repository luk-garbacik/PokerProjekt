import type { Request, Response } from "express";
import { getUsers, deleteUser, updateUser } from "./userAdmin.service.ts";

export async function getUsersController(req: Request, res: Response) {
    const users = await getUsers();
    res.json(users);
}

export async function deleteUserController(req: Request, res: Response) {
    const id = Number(req.params.id);
    await deleteUser(id);
    res.json({ message: "User deleted" });
}

export async function updateUserController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await updateUser(id, req.body);
    res.json(result);
}