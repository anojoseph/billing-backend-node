import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

export const superadminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ message: "Access denied - Insufficient role" });
  }
  next();
};
