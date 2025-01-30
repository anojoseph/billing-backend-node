import { Request, Response } from "express";
import TableModel from "../../models/table/table"; // Corrected the typo here

export const getAllTables = async (req: Request, res: Response) => {
    try {
        const Tables = await TableModel.find();
        res.status(200).json(Tables);
    } catch (error) {
        console.error("Error retrieving product items:", error);
        res.status(500).json({ message: "Error retrieving product items", error });
    }
};

export const getTableById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const Table = await TableModel.findOne({ id: id });
        if (!Table) {
            res.status(404).json({ message: "Table not found" });
            return;
        }
        res.status(200).json(Table);
    } catch (error) {
        console.error("Error retrieving Table:", error);
        res.status(500).json({ message: "Error retrieving Table", error });
    }
};


export const createTable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, status, no, qr_code } = req.body;
        const existingTable = await TableModel.findOne({ name });
        if (existingTable) {
            res.status(400).json({ message: "Table with this name already exists" });
            return;
        }
        const newTable = new TableModel({ name, status, no, qr_code });
        const savedTable = await newTable.save();
        res.status(201).json(savedTable);
    } catch (error) {
        res.status(500).json({ message: "Error creating Table", error });
    }
};

export const updateTable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // This is the custom `id` field from the URL
        const { name, status, no, qr_code } = req.body;

        // Check if a table with the same name already exists (excluding the current table)
        if (no) {
            const existingTable = await TableModel.findOne({ no, id: { $ne: id } });

            if (existingTable) {
                res.status(400).json({ message: "Table with this no already exists" });
                return;
            }
        }

        // Update the table using the custom `id` field
        const updatedTable = await TableModel.findOneAndUpdate(
            { id: id }, // Query by the custom `id` field
            { name, status, no, qr_code }, // Fields to update
            { new: true, runValidators: true } // Options: return the updated document and run validators
        );

        if (!updatedTable) {
            res.status(404).json({ message: "Table not found" });
            return;
        }

        res.status(200).json(updatedTable);
    } catch (error) {
        console.error("Error updating Table:", error);
        res.status(500).json({ message: "Error updating Table", error });
    }
};

export const deleteTable = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedTable = await TableModel.findOneAndUpdate({ id: id }, { deleted_at: new Date() });
        if (!deletedTable) {
            res.status(404).json({ message: "Table not found" });
            return;
        }
        res.status(200).json({ message: "Table deleted successfully" });
    } catch (error) {
        console.error("Error deleting Table:", error);
        res.status(500).json({ message: "Error deleting Table", error });
    }
};