import mongoose, { Document, Schema } from "mongoose";

interface TableModel extends Document {
    _id: string;
    no: number;
    name: string;
    status: boolean;
    qr_code: boolean;
    deleted_at?: Date | null;
}

const tableSchema = new Schema<TableModel>(
    {
        no: { type: Number, required: true, unique: true },
        name: { type: String, default: null },
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
