import mongoose from 'mongoose';

const printJobSchema = new mongoose.Schema({
  content: { type: String, required: true },
  status: { type: String, enum: ['pending', 'printed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PrintJob', printJobSchema);
