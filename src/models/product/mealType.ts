import mongoose, { Document, Schema } from "mongoose";

interface MealTypeModel extends Document {
    name: string;
    status: boolean;
    deleted_at?: Date | null;
}

const MealTypeModelSchema = new Schema<MealTypeModel>(
    {
        name: { type: String, required: true, unique: true },
        status: { type: Boolean, required: true },
        deleted_at: { type: Date, default: null },
    },
    {
        timestamps: true
    }
);

const MealTypeModel = mongoose.model<MealTypeModel>("MealType", MealTypeModelSchema);

export default MealTypeModel;