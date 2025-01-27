import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        [key: string]: any; // Add any additional properties if needed
      };
    }
  }
}
