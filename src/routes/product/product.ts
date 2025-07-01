import express, { RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';
import { getAllProductItems, getProductItemById, createProductItem, updateProductItem, deleteProductItem, bulkUploadProducts } from '../../controllers/product/productItemController';
import { getAllMealTypes, getMealTypeById, createMealType, updateMealType, deleteMealType } from '../../controllers/product/mealType';
import { createProduct, updateProduct, deleteProduct, getAllProducts, getProductById, searchProducts } from '../../controllers/product/product';
import uploadExcel from "../../utils/multerExcel";

const router = express.Router();

// Serve static files (images)
router.use('/uploads', express.static(path.join(__dirname, '../../../uploads')));  // This makes the images accessible at /uploads/...

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder where images will be stored
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.fieldname}${fileExtension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024  // 5MB file size limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
        cb(null, true);
    }
});

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

router.get("/product", getAllProducts);
router.get("/product/search", searchProducts);
router.get("/product/:id", getProductById);
router.post("/product", upload.single('image'), createProduct); // Adding image upload here
router.patch("/product/:id", upload.single('image'), updateProduct); // Adding image upload here
router.delete("/product/:id", deleteProduct);

router.post("/bulk-upload", uploadExcel.single("file"), bulkUploadProducts as RequestHandler);

export default router;
