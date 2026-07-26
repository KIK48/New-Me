import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../packages/db/src/prisma";
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiry } from "../utils/tokens";

const router = Router();

// Access token stays short-lived (1h) — the refresh token is what actually
// keeps a user signed in. Every successful refresh rotates both: the old
// refresh token row is deleted and a new one issued with expiresAt pushed
// another 30 days out, so an active user never re-logs-in, but 30 days of
// inactivity (or a stolen token going unused) forces a real login.
async function issueTokens(userId: string, email: string) {
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: "1h" });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefreshToken(refreshToken), expiresAt: refreshTokenExpiry() },
  });

  return { token, refreshToken };
}

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

  const { token, refreshToken } = await issueTokens(user.id, user.email);
  res.status(201).json({ token, refreshToken });
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

  const { token, refreshToken } = await issueTokens(user.id, user.email);
  res.json({ token, refreshToken });
});

// POST /auth/refresh — trade a valid, unexpired refresh token for a new
// access token, rotating the refresh token in the same call
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: "Refresh token expired or invalid" });
  }

  // Rotate: delete the used token before issuing a new one, so a stolen
  // refresh token can't be replayed after the legitimate client uses it
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const tokens = await issueTokens(stored.user.id, stored.user.email);
  res.json(tokens);
});

// POST /auth/logout — best-effort revoke so a stolen refresh token stops
// working immediately instead of staying valid for its remaining 30 days
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken && typeof refreshToken === "string") {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashRefreshToken(refreshToken) } });
  }

  res.status(204).send();
});

export default router;
