import jwt from "jsonwebtoken";

const JWT_SECRET:any = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRY: any = process.env.JWT_EXPIRY || "1d";
const JWT_REFRESH_SECRET:any = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
const JWT_REFRESH_EXPIRY:any = process.env.JWT_REFRESH_EXPIRY || "7d";



export const generateAccessToken = (payload: object): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};



export const generateRefreshToken = (payload: object): string => {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
};



export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
