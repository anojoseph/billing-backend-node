import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth/authRoute"; // Keep the auth routes
import productItemRoute from "./routes/product/productItem"; // Product item routes
import mongoose from "mongoose";
import { authMiddleware } from "./middlewares/auth/auth"; // Import your auth middleware
import datatableRoutes from './routes/datatable/datatableRoute';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:4200', // Local development
  'https://billing-frontend-4pxo.onrender.com' // Production frontend
];

const corsOptions = {
  origin: (origin:any, callback:any) => {
    // Allow the specified origins or no origin (for non-browser requests)
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

app.use(authMiddleware);
app.use('/data-table', datatableRoutes);
app.use("/product", productItemRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});