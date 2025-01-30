import express from "express";
import { getAllProductItems, getProductItemById, createProductItem, updateProductItem, deleteProductItem, } from "../../controllers/product/productItemController";
import { getAllMealTypes, getMealTypeById, createMealType, updateMealType, deleteMealType } from "../../controllers/product/mealType";

const router = express.Router();

router.get("/product-items", getAllProductItems);
router.get("/product-items/:id", getProductItemById);
router.post("/product-items", createProductItem);
router.patch("/product-items/:id", updateProductItem);
router.delete("/product-items/:id", deleteProductItem);

router.get("/meal-type", getAllMealTypes);
router.get("/meal-type/:id", getMealTypeById);
router.post("/meal-type", createMealType);
router.patch("/meal-type/:id", updateMealType);
router.delete("/meal-type/:id", deleteMealType);


export default router;