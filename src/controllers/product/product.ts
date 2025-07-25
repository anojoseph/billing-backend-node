import { Request, Response } from "express";
import ProductModel from "../../models/product/product";
import ProductItemModel from "../../models/product/produtcItem";
import MealTypeModel from "../../models/product/mealType";
import Kitchen from "../../models/kitchen/Kitchen";

// Create a new product with an image
export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, price, ingredients, type, mealType, qty, selectedQty, kitchen, addons } = req.body;
        const image = req.file?.path;  // Image is now optional
        const imageUrl = image ? `${req.protocol}://${req.get("host")}/${image.replace(/\\/g, "/")}` : null;  // Use null if no image is provided
        const ingredientsArray = ingredients ? ingredients.split(",").map((item: string) => item.trim()) : [];

        const mealTypes = await MealTypeModel.findById(mealType);
        if (!mealTypes) {
            res.status(400).json({ message: "Invalid mealType ID" });
            return;
        }

        const productItem = await ProductItemModel.findById(type);
        if (!productItem) {
            res.status(400).json({ message: "Invalid type ID" });
            return;
        }

        const existingProduct = await ProductModel.findOne({ name });
        if (existingProduct) {
            res.status(400).json({ message: "Product with the same name already exists" });
            return;
        }


        const parsedAddons = Array.isArray(addons)
            ? addons
            : typeof addons === 'string'
                ? JSON.parse(addons)
                : [];


        //const kitchens = await MealTypeModel.findById(kitchen);

        const product = new ProductModel({
            name,
            price,
            ingredients: ingredientsArray,
            image: imageUrl,
            type: productItem._id,
            mealType: mealTypes._id,
            qty,
            selectedQty,
            status: true,
            kitchen: kitchen,
            addons: parsedAddons
        });

        await product.save();
        await Kitchen.findByIdAndUpdate(
            kitchen,
            { $addToSet: { items: product._id } }
        );
        res.status(201).json({ message: "Product created successfully", product });
    } catch (error: any) {
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
};


// Update a product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, name, price, ingredients, type, mealType, qty, selectedQty, kitchen, addons } = req.body;
        const image = req.file?.path;  // Image is now optional

        const product = await ProductModel.findById(id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        if (name) product.name = name;
        if (price) product.price = price;
        if (ingredients) product.ingredients = ingredients.split(",").map((item: string) => item.trim());
        if (type) {
            const productItem = await ProductItemModel.findById(type);
            if (productItem) product.type = productItem._id;
        }
        if (mealType) {
            const mealTypes = await MealTypeModel.findById(mealType);
            if (mealTypes) product.mealType = mealTypes._id;
        }
        if (qty) product.qty = qty;
        if (selectedQty) product.selectedQty = selectedQty;
        if (image) {
            product.image = `${req.protocol}://${req.get("host")}/${image.replace(/\\/g, "/")}`;
        }
        if (addons) {
            product.addons = typeof req.body.addons === 'string' ? JSON.parse(req.body.addons) : req.body.addons;
        }
        if (kitchen && kitchen.toString() !== product.kitchen?.toString()) {
            // Remove from old kitchen
            if (product.kitchen) {
                await Kitchen.findByIdAndUpdate(product.kitchen, {
                    $pull: { items: product._id }
                });
            }



            // Add to new kitchen
            await Kitchen.findByIdAndUpdate(kitchen, {
                $addToSet: { items: product._id }
            });

            product.kitchen = kitchen;
        }

        await product.save();
        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error: any) {
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
};


// Soft delete a product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        product.status = false;
        product.deleted_at = new Date();
        await product.save();
        res.status(200).json({ message: "Product deleted successfully", product });
    } catch (error: any) {
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
};

// Get all active products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await ProductModel.find({ status: true, deleted_at: null });
        if (products.length === 0) {
            res.status(404).json({ message: "No active products found" });
            return;
        }

        res.status(200).json(products.map(product => ({
            ...product.toObject(),
            image: product.image ? product.image.replace(/\\/g, "/") : null,
        })));
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
};

// Get a single product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        res.status(200).json({
            ...product.toObject(),
            image: product.image ? product.image.replace(/\\/g, "/") : null,
        });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching product", error: error.message });
    }
};

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, mealType, productItem } = req.query;
        let filter: any = { status: true };

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        if (mealType) {
            filter.mealType = mealType;
        }
        if (productItem) {
            filter.type = productItem;
        }

        const products = await ProductModel.find(filter);

        if (products.length === 0) {
            res.status(200).json({ message: "No matching products found", data: [] });
            return;
        }

        res.status(200).json({
            message: "Products fetched successfully",
            data: products.map(product => ({
                ...product.toObject(),
                image: product.image ? product.image.replace(/\\/g, "/") : null,
            })),
        });
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
};


