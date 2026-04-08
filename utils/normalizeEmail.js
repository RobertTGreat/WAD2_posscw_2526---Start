// utils/normalizeEmail.js — single rule for stored + lookup email (custom signups)
export function normalizeEmail(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}
