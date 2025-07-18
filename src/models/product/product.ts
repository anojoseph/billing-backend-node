import mongoose, { Schema, Document } from "mongoose";

interface ProductModel extends Document {
    name: string;
    price: number;
    ingredients: string[];
    image: string;
    type: any;
    mealType: any;
    qty: number;
    selectedQty: number;
    status: boolean;
    deleted_at?: Date | null;
    kitchen: any;
    addons?: {
        name: string;
        price: number;
    }[];
}

const productSchema = new Schema<ProductModel>(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        ingredients: { type: [String] },
        image: { type: String },
        mealType: { type: mongoose.Schema.Types.ObjectId, ref: 'MealType' },
        type: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductItem' },
        qty: { type: Number },
        selectedQty: { type: Number },
        status: { type: Boolean, default: true },
        deleted_at: { type: Date, default: null },
        kitchen: { type: mongoose.Schema.Types.ObjectId, ref: 'Kitchen' },
        addons: {
            type: [
                {
                    name: { type: String, required: true },
                    price: { type: Number, required: true }
                }
            ],
            default: undefined  // Optional field
        }
    },
    { timestamps: true }
);

const ProductModel = mongoose.model<ProductModel>("Product", productSchema);

export default ProductModel;
