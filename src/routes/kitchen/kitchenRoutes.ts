import express, { RequestHandler } from "express";
import {
    getKitchens,
    getKitchenById,
    createKitchen,
    updateKitchen,
    deleteKitchen,
} from "../../controllers/kitchen/kitchenController";

const router = express.Router();

router.get("/kitchen", getKitchens);
router.get("/kitchen/:id", getKitchenById as RequestHandler);
router.post("/kitchen/", createKitchen as RequestHandler);
router.patch("/kitchen/:id", updateKitchen as RequestHandler);
router.delete("/kitchen/:id", deleteKitchen as RequestHandler);

export default router;
