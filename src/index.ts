import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth/authRoute";
import productRoute from "./routes/product/product";
import tableRoute from "./routes/table/table";
import orderRoute from "./routes/orders/order"
import settingsRoutes from './routes/settings/settings.routes';
import reportRoutes from './routes/reports/report.routes';
import kitchenRoutes from "./routes/kitchen/kitchenRoutes";
import menuRoutes from './routes/menu/menu.routes';
//import port from "./routes/port/port"
import PrintJob from './models/settings/printJob';


import mongoose from "mongoose";
import { authMiddleware } from "./middlewares/auth/auth";
import datatableRoutes from './routes/datatable/datatableRoute';
import cors from 'cors';
import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:4200', 'https://billing-frontend-4pxo.onrender.com', 'http://localhost:8081'
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.use(express.json());
app.use("/api/auth", authRoutes);

const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/api/print-jobs', async (req, res) => {
  try {
    const jobs = await PrintJob.find({ status: 'pending' }).limit(10);
    res.json(jobs.map(job => ({
      id: job._id,
      content: job.content
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch print jobs' });
  }
});
app.post('/api/print-jobs/:id/complete', async (req, res) => {
  try {
    await PrintJob.findByIdAndUpdate(req.params.id, { status: 'printed' });
    res.json({ message: 'Print job marked as printed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update print job' });
  }
});


app.use(authMiddleware);
app.use('/data-table', datatableRoutes);
app.use("/product", productRoute);
app.use("/table", tableRoute);
app.use('/order', orderRoute);
app.use('/settings', settingsRoutes);
app.use('/reports', reportRoutes);
app.use("/kitchens", kitchenRoutes);
app.use('/menu', menuRoutes);
//app.use("/ports", port);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

