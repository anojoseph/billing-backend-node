import mongoose, { Document, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

interface User extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "superadmin" | "admin";
}

// Create the User schema
const userSchema = new Schema<User>({
  id: { type: String, default: uuidv4 },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["user", "superadmin", "admin"], default: "user" },
});

// Create the Mongoose model
const UserModel = mongoose.model<User>("User", userSchema);

export default UserModel;
