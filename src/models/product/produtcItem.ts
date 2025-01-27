import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Define the ProductItemModel interface
interface ProductItemModel extends Document {
    id: string;
    name: string;
    status: boolean;
    deleted_at?: Date | null;
}

const productItemSchema = new Schema<ProductItemModel>(
    {
        id: { type: String, default: uuidv4 }, // Auto-generate a UUID
        name: { type: String, required: true, unique: true },
        status: { type: Boolean, required: true },
        deleted_at: { type: Date, default: null }, // Optional deleted_at field
    },
    {
        timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    }
);

// Create the model from the schema
const ProductItemModel = mongoose.model<ProductItemModel>("ProductItem", productItemSchema);

export default ProductItemModel;
