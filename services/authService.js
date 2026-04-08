// services/authService.js — bcrypt password hashing + signed session JWT (not encryption of passwords at rest beyond hashing)
import bcrypt from "bcryptjs";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import Tokens from "csrf";

const tokens = new Tokens();
const SALT_ROUNDS = 12;

const hashAsync = promisify(bcrypt.hash);
const compareAsync = promisify(bcrypt.compare);
const JWT_EXPIRY = "7d";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set to a long random string in production");
    }
    return "dev-only-change-me-in-env";
  }
  return secret;
}

export function generateCsrfSecret() {
  return tokens.secretSync();
}

export function createCsrfToken(csrfSecret) {
  return tokens.create(csrfSecret);
}

export function verifyCsrfToken(csrfSecret, token) {
  return tokens.verify(csrfSecret, token);
}

export async function hashPassword(plain) {
  return hashAsync(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, passwordHash) {
  if (!passwordHash) return false;
  return compareAsync(plain, passwordHash);
}

/** bcrypt only hashes the first 72 bytes — reject longer passwords at sign-up so login matches. */
export function validatePasswordForSignUp(plain) {
  if (plain.length < 8) return "Password must be at least 8 characters.";
  if (Buffer.byteLength(plain, "utf8") > 72) {
    return "Password must be at most 72 bytes (use a shorter password or fewer emoji).";
  }
  return null;
}

export function signAuthCookiePayload({ userId, role, csrfSecret }) {
  return jwt.sign({ sub: userId, role, csrfSecret }, getJwtSecret(), {
    expiresIn: JWT_EXPIRY,
  });
}

export function verifyAuthToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function userForTemplate(user) {
  if (!user) return null;
  const { _id, name, email, role } = user;
  return { id: _id, name, email, role };
}
