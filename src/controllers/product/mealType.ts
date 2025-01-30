import { Request, Response } from "express";
import MealTypeModel from "../../models/product/mealType"; // Corrected the typo here

export const getAllMealTypes = async (req: Request, res: Response) => {
    try {
        const MealTypes = await MealTypeModel.find();
        res.status(200).json(MealTypes);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving product items", error });
    }
};

export const getMealTypeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const MealType = await MealTypeModel.findOne({ id: id });
        if (!MealType) {
            res.status(404).json({ message: "Meal type not found" });
            return;
        }
        res.status(200).json(MealType);
    } catch (error) {
        console.error("Error retrieving meal type:", error);
        res.status(500).json({ message: "Error retrieving meal type", error });
    }
};


export const createMealType = async (req: Request, res: Response) => {
    try {
        const { name, status } = req.body;
        const isNameExists = await MealTypeModel.findOne({ name });
        if (isNameExists) {
            res.status(400).json({ message: `Meal type ${name} already exists` });
            return;
        }
        const newMealType = new MealTypeModel({ name, status });
        const savedMealType = await newMealType.save();
        res.status(201).json(savedMealType);
    } catch (error) {
        res.status(500).json({ message: "Error creating meal type", error });
    }
};

export const updateMealType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // This is the custom `id` field from the URL
        const { name, price } = req.body;

        // Check if a product with the same name already exists (excluding the current product)
        if (name) {
            const existingMeal = await MealTypeModel.findOne({ name, id: { $ne: id } });

            if (existingMeal) {
                res.status(400).json({ message: "Meal Type with this name already exists" });
                return;
            }
        }

        // Update the product using the custom `id` field
        const updatedProduct = await MealTypeModel.findOneAndUpdate(
            { id: id }, // Query by the custom `id` field
            { name, price }, // Fields to update
            { new: true, runValidators: true } // Options: return the updated document and run validators
        );

        if (!updatedProduct) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "Error updating product", error });
    }
};

export const deleteMealType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedMealType = await MealTypeModel.findOneAndUpdate({ id: id }, { deleted_at: new Date() });
        if (!deletedMealType) {
            res.status(404).json({ message: "Meal type not found" });
            return;
        }
        res.status(200).json({ message: "Meal type deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting meal type", error });
    }
};