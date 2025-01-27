import express, { Request, Response } from "express";
import { registerSuperadmin, login, refreshToken } from "../controllers/authController";

const router = express.Router();

router.post("/register-superadmin", async (req: Request, res: Response) => {
  try {
    await registerSuperadmin(req, res);
  } catch (error: any) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    await login(req, res);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

router.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    await refreshToken(req, res);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

export default router;
