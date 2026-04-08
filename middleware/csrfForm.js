// middleware/csrfForm.js — double-submit using csrf secret embedded in JWT (see authService)
import { createCsrfToken, verifyCsrfToken } from "../services/authService.js";

export function attachFormCsrf(req, res, next) {
  if (req.auth?.csrfSecret) {
    res.locals.csrfToken = createCsrfToken(req.auth.csrfSecret);
  }
  next();
}

export function requireFormCsrf(req, res, next) {
  const token = req.body?._csrf;
  if (!req.auth?.csrfSecret || !token || !verifyCsrfToken(req.auth.csrfSecret, token)) {
    return res.status(403).render("error", {
      title: "Invalid session",
      message: "Security check failed. Please refresh the page and try again.",
    });
  }
  next();
}
