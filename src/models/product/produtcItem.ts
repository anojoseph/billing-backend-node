import mongoose, { Document, Schema } from "mongoose";

interface ProductItemModel extends Document {
    name: string;
    status: boolean;
    deleted_at?: Date | null;
}

const productItemSchema = new Schema<ProductItemModel>(
    {
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