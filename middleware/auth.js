// middleware/auth.js — load user from httpOnly JWT cookie; role guards
import { UserModel } from "../models/userModel.js";
import { verifyAuthToken, userForTemplate } from "../services/authService.js";

const COOKIE_NAME = "auth_token";

export function getAuthCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export async function loadAuthUser(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    const payload = verifyAuthToken(token);
    req.auth = payload;
    if (payload?.sub != null) {
      const user = await UserModel.findById(String(payload.sub));
      if (user && !user.disabled) {
        req.user = user;
        res.locals.user = userForTemplate(user);
        res.locals.isOrganiser = user.role === "organiser";
        res.locals.isLoggedIn = true;
      }
    }
    if (!req.user) {
      res.locals.user = null;
      res.locals.isOrganiser = false;
      res.locals.isLoggedIn = false;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user)
    return res.status(401).render("error", {
      title: "Sign in required",
      message: "Please sign in to continue.",
    });
  next();
}

export function requireOrganiser(req, res, next) {
  if (!req.user || req.user.role !== "organiser") {
    return res.status(403).render("error", {
      title: "Access denied",
      message: "Organiser access only.",
    });
  }
  next();
}

export function requireAuthJson(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

export function requireOrganiserJson(req, res, next) {
  if (!req.user || req.user.role !== "organiser")
    return res.status(403).json({ error: "Forbidden" });
  next();
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export { COOKIE_NAME };
