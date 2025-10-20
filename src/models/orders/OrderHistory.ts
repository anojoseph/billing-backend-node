// models/OrderHistory.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOrderHistory extends Document {
  orderId: mongoose.Types.ObjectId;
  previousData: any;
  updatedData: any;
  editedBy?: string;
  editedAt: Date;
}

const OrderHistorySchema = new Schema<IOrderHistory>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    previousData: { type: Object, required: true },
    updatedData: { type: Object, required: true },
    editedBy: { type: String },
    editedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model<IOrderHistory>("OrderHistory", OrderHistorySchema);
