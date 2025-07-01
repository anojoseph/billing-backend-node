import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../../utils/jwt"; // Modify to use both token generators
import UserModel from "../../models/auth/User";
import { v4 as uuidv4 } from "uuid";

export const registerSuperadmin = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const superadmin = new UserModel({
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
    role: "superadmin",
  });

  await superadmin.save();
  res.status(201).json({ message: "Superadmin created", superadmin });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(400).json({ message: "Invalid credentials" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400).json({ message: "Invalid credentials" });
    return;
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

  res.status(200).json({
    message: "Login successful",
    access_token: accessToken,
    refresh_token: refreshToken,
    user_details: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    user_type: user.role,
    user_id: user._id
  });
};

export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = verifyToken(refresh_token);
    const newAccessToken = generateAccessToken({ id: decoded.id, role: decoded.role });
    return res.status(200).json({
      message: "Token refreshed successfully",
      access_token: newAccessToken,
    });
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired refresh token" });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, email, role, currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();
    res.status(200).json({ message: "User updated successfully", user });

  } catch (error: any) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};


