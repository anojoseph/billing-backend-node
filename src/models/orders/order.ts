import mongoose, { Schema, model, Document, Types } from 'mongoose';

interface IOrder extends Document {
    tableId?: Types.ObjectId;
    orderType: 'Dine-in' | 'Takeaway' | 'Bill';
    orderNumber: string;
    items: Array<{
        id: Types.ObjectId;
        quantity: number;
        price: number;
        totalPrice: number;
    }>;
    totalAmount: number;
    status: 'pending' | 'completed';
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: Types.ObjectId | null;
    updated_by: Types.ObjectId | null;
    deleted_by: Types.ObjectId | null;
    paymentType: 'Cash' | 'UPI' | 'Card' | 'Swiggy' | 'Zomato' | 'Other'
}

const OrderSchema = new Schema({
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function (this: { orderType: string }) {
            return this.orderType === 'Dine-in';
        }
    },
    orderType: { type: String, enum: ['Dine-in', 'Takeaway', 'Bill'], required: true },
    orderNumber: { type: String, required: false, unique: true },
    items: [{
        id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        totalPrice: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deleted_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    paymentType: {
        type: String, enum: ['Cash', 'UPI', 'Card', 'Swiggy', 'Zomato', 'Other'],
        required: function (this: { orderType: string }) {
            return this.orderType !== 'Dine-in';
        }
    }
}, { timestamps: false });




OrderSchema.pre('validate', function (next) {
    if (this.orderType === 'Dine-in' && !this.tableId) {
        this.invalidate('tableId', 'Table ID is required for Dine-in orders.');
    }
    next();
});

const Order = model<IOrder>('Order', OrderSchema);

export { Order };
