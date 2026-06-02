import type  { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Brak tokenu" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded: any = jwt.verify(
            token,
            process.env.JWT_SECRET || "SUPER_SECRET"
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({ error: "Brak uprawnień" });
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: "Nieprawidłowy token" });
    }
}
