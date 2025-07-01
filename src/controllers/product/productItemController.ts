import { Request, Response } from "express";
import ProductItemModel from "../../models/product/produtcItem"; // Corrected the filename typo
import MealTypeModel from "../../models/product/mealType";
import ProductModel from "../../models/product/product";
import XLSX from "xlsx";
import fs from "fs";
import mongoose from "mongoose";

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

export const bulkUploadProducts = async (req: Request, res: Response) => {
  try {
    const filePath = req.file?.path;
    if (!filePath) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of data) {
      const {
        name,
        price,
        ingredients,
        mealType,
        type,
        qty,
        selectedQty
      } = row as any;

      if (!name || !price || !mealType || !type) {
        skippedCount++;
        continue;
      }

      // Resolve MealType (ObjectId or name)
      let mealTypeDoc = null;
      if (mongoose.Types.ObjectId.isValid(mealType)) {
        mealTypeDoc = await MealTypeModel.findById(mealType);
      }
      if (!mealTypeDoc) {
        mealTypeDoc = await MealTypeModel.findOne({ name: mealType });
      }
      if (!mealTypeDoc) {
        console.warn(`Skipping row, mealType not found: ${mealType}`);
        skippedCount++;
        continue;
      }

      // Resolve ProductItem (ObjectId or name)
      let typeDoc = null;
      if (mongoose.Types.ObjectId.isValid(type)) {
        typeDoc = await ProductItemModel.findById(type);
      }
      if (!typeDoc) {
        typeDoc = await ProductItemModel.findOne({ name: type });
      }
      if (!typeDoc) {
        console.warn(`Skipping row, product type not found: ${type}`);
        skippedCount++;
        continue;
      }

      const ingredientsArray = ingredients
        ? ingredients.split(",").map((i: string) => i.trim())
        : [];

      const existingProduct = await ProductModel.findOne({ name });

      if (existingProduct) {
        // Update
        existingProduct.price = price;
        existingProduct.ingredients = ingredientsArray;
        existingProduct.mealType = mealTypeDoc._id;
        existingProduct.type = typeDoc._id;
        existingProduct.qty = qty;
        existingProduct.selectedQty = selectedQty;
        existingProduct.status = true;
        await existingProduct.save();
        updatedCount++;
      } else {
        // Insert
        const newProduct = new ProductModel({
          name,
          price,
          ingredients: ingredientsArray,
          mealType: mealTypeDoc._id,
          type: typeDoc._id,
          qty,
          selectedQty,
          status: true
        });
        await newProduct.save();
        insertedCount++;
      }
    }

    fs.unlinkSync(filePath); // cleanup

    res.status(200).json({
      message: "Bulk upload completed",
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to process Excel file", error: error.message });
  }
};
