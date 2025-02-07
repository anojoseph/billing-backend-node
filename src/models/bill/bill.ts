import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'TableModel' },
    items: [
        {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            totalPrice: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, required: true },
    type: {
        type: String,
        enum: ['Dine-in', 'Takeaway', 'Bill'],
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
