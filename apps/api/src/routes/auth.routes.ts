import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../packages/db/src/prisma";

const router = Router();

// POST /auth/register — create a new account and return a JWT
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "email and password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  // bcrypt hash with cost factor 10 — secure and fast enough for a small app
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed } });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" } // token expires after 1 hour — frontend must re-login after expiry
  );

  res.status(201).json({ token });
});

// POST /auth/login — verify credentials and return a fresh JWT
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Return the same error whether the user doesn't exist or the password is wrong
  // so an attacker can't tell which emails are registered
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

export default router;
