import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth/authRoute";
import productRoute from "./routes/product/product";
import tableRoute from "./routes/table/table";
import orderRoute from "./routes/orders/order"
import settingsRoutes from './routes/settings/settings.routes';
import reportRoutes from './routes/reports/report.routes';
import kitchenRoutes from "./routes/kitchen/kitchenRoutes";


import mongoose from "mongoose";
import { authMiddleware } from "./middlewares/auth/auth";
import datatableRoutes from './routes/datatable/datatableRoute';
import cors from 'cors';
import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:4200', 'https://billing-frontend-4pxo.onrender.com'
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

app.use(authMiddleware);
app.use('/data-table', datatableRoutes);
app.use("/product", productRoute);
app.use("/table", tableRoute);
app.use('/order', orderRoute);
app.use('/settings', settingsRoutes);
app.use('/reports', reportRoutes);
app.use("/kitchens", kitchenRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});