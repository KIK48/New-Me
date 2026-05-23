import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request so route handlers can read req.user without casting
export interface AuthRequest extends Request {
  user: { userId: string; email: string };
}

// Attached to any route that requires the user to be logged in.
// Expects: Authorization: Bearer <jwt>
// On success: calls next() and attaches the decoded payload to req.user
// On failure: returns 401 so the frontend knows to redirect to /login
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7); // strip "Bearer " prefix

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    (req as AuthRequest).user = payload;
    next();
  } catch {
    // jwt.verify throws when the token is expired or tampered with
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}
