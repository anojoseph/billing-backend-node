import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../utils/jwt";

// Extend Express's Request interface to include the `user` property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string }; // Add more fields if necessary
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized - No token provided" });
    return; 
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({ message: "Invalid token", error: error.message });
    return; 
  }
};

export const superadminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Access denied - Insufficient role" });
  }
  next();
};
