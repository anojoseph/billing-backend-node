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

app.use(cors());

app.use(cors({
  origin: 'http://localhost:4200', 
}));

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