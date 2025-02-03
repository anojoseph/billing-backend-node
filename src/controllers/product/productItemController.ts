import { Request, Response } from "express";
import ProductItemModel from "../../models/product/produtcItem"; // Corrected the filename typo

export const getAllProductItems = async (req: Request, res: Response) => {
    try {
        const productItems = await ProductItemModel.find({ deleted_at: null });
        res.status(200).json(productItems);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving product items", error });
    }
};

export const getProductItemById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productItem = await ProductItemModel.findById(id);
        if (!productItem) {
            res.status(404).json({ message: "Product item not found" });
            return;
        }
        res.status(200).json(productItem);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving product item", error });
    }
};

export const createProductItem = async (req: Request, res: Response) => {
    try {
        const { name, status } = req.body;
        const newProductItem = new ProductItemModel({ name, status });
        const savedProductItem = await newProductItem.save();
        res.status(201).json(savedProductItem);
    } catch (error) {
        res.status(500).json({ message: "Error creating product item", error });
    }
};

export const updateProductItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, status } = req.body;
        const updatedProductItem = await ProductItemModel.findByIdAndUpdate(
            id,
            { name, status },
            { new: true, runValidators: true }
        );

        if (!updatedProductItem) {
            res.status(404).json({ message: "Product item not found" });
            return;
        }

        res.status(200).json(updatedProductItem);
    } catch (error) {
        res.status(500).json({ message: "Error updating product item", error });
    }
};

export const deleteProductItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedProductItem = await ProductItemModel.findByIdAndUpdate(
            id,
            { deleted_at: new Date(), status: false },
            { new: true }
        );
        if (!deletedProductItem) {
            res.status(404).json({ message: "Product item not found" });
            return;
        }
        res.status(200).json({ message: "Product item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product item", error });
    }
};
