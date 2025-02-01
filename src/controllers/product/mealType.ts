import { Request, Response } from "express";
import MealTypeModel from "../../models/product/mealType";

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
        const MealType = await MealTypeModel.findById(id);
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

export const updateMealType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (name) {
            const existingMeal = await MealTypeModel.findOne({ name, _id: { $ne: id } });
            if (existingMeal) {
                res.status(400).json({ message: "Meal Type with this name already exists" });
                return;
            }
        }

        const updatedMealType = await MealTypeModel.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedMealType) {
            res.status(404).json({ message: "Meal type not found" });
            return;
        }

        res.status(200).json(updatedMealType);
    } catch (error) {
        res.status(500).json({ message: "Error updating meal type", error });
    }
};

export const deleteMealType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedMealType = await MealTypeModel.findByIdAndUpdate(id, { deleted_at: new Date() });
        if (!deletedMealType) {
            res.status(404).json({ message: "Meal type not found" });
            return;
        }
        res.status(200).json({ message: "Meal type deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting meal type", error });
    }
};
