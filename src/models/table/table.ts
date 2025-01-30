import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface TableModel extends Document {
    id: string;
    no: number;
    name: string;
    status: boolean;
    qr_code: boolean;
    deleted_at?: Date | null;
}

const tableSchema = new Schema<TableModel>(
    {
        id: { type: String, default: uuidv4 },
        no: { type: Number, required: true, unique: true },
        name: { type: String, default: null},
        status: { type: Boolean, required: true },
        qr_code: { type: Boolean, default: null },
        deleted_at: { type: Date, default: null },
    },
    {
        timestamps: true
    }
);

const TableModel = mongoose.model<TableModel>("Table", tableSchema);

export default TableModel;
