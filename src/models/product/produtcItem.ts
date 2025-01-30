import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface ProductItemModel extends Document {
    id: string;
    name: string;
    status: boolean;
    deleted_at?: Date | null;
}

const productItemSchema = new Schema<ProductItemModel>(
    {
        id: { type: String, default: uuidv4 },
        name: { type: String, required: true, unique: true },
        status: { type: Boolean, required: true },
        deleted_at: { type: Date, default: null },
    },
    {
        timestamps: true
    }
);

const ProductItemModel = mongoose.model<ProductItemModel>("ProductItem", productItemSchema);

export default ProductItemModel;
