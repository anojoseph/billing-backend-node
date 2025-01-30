import express from "express";
import {
    getAllMealTypes,
    getMealTypeById,
    createMealType,
    updateMealType,
    deleteMealType,
} from "../../controllers/product/mealType";


export const router = express.Router();

router.get("/meal-type", getAllMealTypes);
router.get("/meal-type/:id", getMealTypeById);
router.post("/meal-type", createMealType);
router.patch("/meal-type/:id", updateMealType);
router.delete("/meal-type/:id", deleteMealType);

export default router;