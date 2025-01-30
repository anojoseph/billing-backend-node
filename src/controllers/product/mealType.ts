import { Request, Response } from "express";
import MealTypeModel from "../../models/product/mealType"; // Corrected the typo here

export const getAllMealTypes = async (req: Request, res: Response) => {
    try {
        const MealTypes = await MealTypeModel.find();
        res.status(200).json(MealTypes);
    } catch (error) {
        console.error("Error retrieving product items:", error);
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
        const newMealType = new MealTypeModel({ name, status });
        const savedMealType = await newMealType.save();
        res.status(201).json(savedMealType);
    } catch (error) {
        console.error("Error creating meal type:", error);
        res.status(500).json({ message: "Error creating meal type", error });
    }
};

export const updateMealType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, status } = req.body;
        const updatedMealType = await MealTypeModel.findOneAndUpdate(
            { id: id },
            { name, status },
            { new: true, runValidators: true }
        );

        if (!updatedMealType) {
            res.status(404).json({ message: "Meal type not found" });
            return;
        }

        res.status(200).json(updatedMealType);
    } catch (error) {
        console.error("Error updating meal type:", error);
        res.status(500).json({ message: "Error updating meal type", error });
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
        console.error("Error deleting meal type:", error);
        res.status(500).json({ message: "Error deleting meal type", error });
    }
};