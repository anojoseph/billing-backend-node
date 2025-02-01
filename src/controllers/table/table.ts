import { Request, Response } from "express";
import TableModel from "../../models/table/table";

export const getAllTables = async (req: Request, res: Response) => {
    try {
        const tables = await TableModel.find();
        res.status(200).json(tables);
    } catch (error) {
        console.error("Error retrieving tables:", error);
        res.status(500).json({ message: "Error retrieving tables", error });
    }
};

export const getTableById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const table = await TableModel.findById(id);
        if (!table) {
            res.status(404).json({ message: "Table not found" });
            return;
        }
        res.status(200).json(table);
    } catch (error) {
        console.error("Error retrieving table:", error);
        res.status(500).json({ message: "Error retrieving table", error });
    }
};

export const createTable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, status, no, qr_code } = req.body;
        const existingTable = await TableModel.findOne({ no });
        if (existingTable) {
            res.status(400).json({ message: "Table with this number already exists" });
            return;
        }
        const newTable = new TableModel({ name, status, no, qr_code });
        const savedTable = await newTable.save();
        res.status(201).json(savedTable);
    } catch (error) {
        res.status(500).json({ message: "Error creating table", error });
    }
};

export const updateTable = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, status, no, qr_code } = req.body;

        // Check if a table with the same number already exists (excluding the current table)
        if (no) {
            const existingTable = await TableModel.findOne({ no, _id: { $ne: id } });
            if (existingTable) {
                res.status(400).json({ message: "Table with this number already exists" });
                return;
            }
        }

        const updatedTable = await TableModel.findByIdAndUpdate(
            id,
            { name, status, no, qr_code },
            { new: true, runValidators: true }
        );

        if (!updatedTable) {
            res.status(404).json({ message: "Table not found" });
            return;
        }

        res.status(200).json(updatedTable);
    } catch (error) {
        console.error("Error updating table:", error);
        res.status(500).json({ message: "Error updating table", error });
    }
};

export const deleteTable = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedTable = await TableModel.findByIdAndUpdate(id, { deleted_at: new Date() });
        if (!deletedTable) {
            res.status(404).json({ message: "Table not found" });
            return;
        }
        res.status(200).json({ message: "Table deleted successfully" });
    } catch (error) {
        console.error("Error deleting table:", error);
        res.status(500).json({ message: "Error deleting table", error });
    }
};
