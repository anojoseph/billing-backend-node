import express, { Request, Response } from "express";
import { registerSuperadmin, login, refreshToken, updateUser, changePassword } from "../../controllers/auth/authController";
import UserModel from "../../models/auth/User";
import { RequestHandler } from "express-serve-static-core";

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

router.patch("/update-user", async (req: Request, res: Response) => {
    try {
        await updateUser(req, res); // ✅ Fix this line
    } catch (error: any) {
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
});


router.get("/user/:id", async (req: Request, res: Response) => {
    try {
        const user = await UserModel.findById(req.params.id).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch user", error: error.message });
    }
});

router.patch("/change-password", changePassword as RequestHandler);


export default router;
