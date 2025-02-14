import mongoose, { Schema, Document } from "mongoose";

export interface IKitchen extends Document {
    name: string;
    status: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    items: mongoose.Types.ObjectId[];
}

const KitchenSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        status: { type: Boolean, required: true },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        deleted_at: { type: Date, default: null },
        items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Relating with Product model
    },
    { timestamps: true }
);

export default mongoose.model<IKitchen>("Kitchen", KitchenSchema);
