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

