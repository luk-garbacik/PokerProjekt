import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

export function requireAuth(
    req: AuthRequest,
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

        req.user = {
            id: decoded.id,
            role: decoded.role,
        };

        next();
    } catch (err) {
        return res.status(401).json({ error: "Nieprawidłowy token" });
    }
}
