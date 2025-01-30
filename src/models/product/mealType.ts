import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface MealTypeModel extends Document {
    id: string;
    name: string;
    status: boolean;
    deleted_at?: Date | null;
}

const MealTypeModelSchema = new Schema<MealTypeModel>(
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

const MealTypeModel = mongoose.model<MealTypeModel>("MealType", MealTypeModelSchema);

export default MealTypeModel;
