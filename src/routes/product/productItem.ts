import express from "express";
import {
    getAllProductItems,
    getProductItemById,
    createProductItem,
    updateProductItem,
    deleteProductItem,
} from "../../controllers/product/productItemController";

const router = express.Router();

router.get("/product-items", getAllProductItems);
router.get("/product-items/:id", getProductItemById);
router.post("/product-items", createProductItem);
router.patch("/product-items/:id", updateProductItem);
router.delete("/product-items/:id", deleteProductItem);


export default router;