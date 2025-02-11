import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
    billNumber: { type: Number, unique: true },  // Unique Bill Number
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
    createdAt: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null }, // Soft delete field
    deleted_by: { type: String, ref: 'User', default: null }
});

// Middleware to auto-generate bill number starting from 1001
billSchema.pre('save', async function (next) {
    if (!this.billNumber) {
        const lastBill = await mongoose.model('Bill').findOne().sort({ billNumber: -1 });
        this.billNumber = lastBill ? lastBill.billNumber + 1 : 1001;
    }
    next();
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill;
