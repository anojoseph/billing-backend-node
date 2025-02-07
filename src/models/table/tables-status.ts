import mongoose from 'mongoose';

const TableSchema = new mongoose.Schema({
    tableNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: ['free', 'occupied'], default: 'free' }
});

const Tablestatus = mongoose.model('Tablestatus', TableSchema);
export default Tablestatus;
