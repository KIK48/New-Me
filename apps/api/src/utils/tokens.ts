import crypto from "crypto";

export const REFRESH_TOKEN_TTL_DAYS = 30;

// Raw token handed to the client — high-entropy random bytes, not a JWT.
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

// Only the hash is stored, so a leaked DB doesn't hand out usable tokens.
// SHA-256 (not bcrypt) is fine here since the input is already high-entropy,
// unlike a user-chosen password.
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
