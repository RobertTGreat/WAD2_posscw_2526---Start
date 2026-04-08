// utils/organiserSignupCode.js — timing-safe compare for organiser signup secret
import { timingSafeEqual } from "crypto";

export function isOrganiserSignupConfigured() {
  const c = process.env.ORGANISER_SIGNUP_CODE;
  return typeof c === "string" && c.length > 0;
}

export function verifyOrganiserSignupCode(submitted) {
  if (!isOrganiserSignupConfigured()) return false;
  const expected = process.env.ORGANISER_SIGNUP_CODE;
  const a = Buffer.from(String(submitted ?? "").trim(), "utf8");
  const b = Buffer.from(String(expected).trim(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
