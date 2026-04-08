// controllers/authController.js
import { UserModel } from "../models/userModel.js";
import {
  hashPassword,
  verifyPassword,
  signAuthCookiePayload,
  generateCsrfSecret,
  validatePasswordForSignUp,
} from "../services/authService.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import { setAuthCookie, clearAuthCookie } from "../middleware/auth.js";
import {
  isOrganiserSignupConfigured,
  verifyOrganiserSignupCode,
} from "../utils/organiserSignupCode.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUniqueConstraintError(err) {
  const m = String(err?.message ?? err ?? "").toLowerCase();
  return m.includes("unique") || err?.errorType === "uniqueViolated";
}

function validationError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

export const getRegister = (req, res) => {
  if (req.user) return res.redirect("/");
  res.render("auth/register", {
    title: "Create account",
    form: {},
    organiserSignupConfigured: isOrganiserSignupConfigured(),
  });
};

export const postRegister = async (req, res, next) => {
  try {
    if (req.user) return res.redirect("/");
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const confirm = String(req.body.confirmPassword || "");

    if (name.length < 2) throw validationError("Please enter your name.");
    if (!email) throw validationError("Please enter your email address.");
    if (!EMAIL_RE.test(email)) throw validationError("Invalid email address.");
    const pwErr = validatePasswordForSignUp(password);
    if (pwErr) throw validationError(pwErr);
    if (password !== confirm) throw validationError("Passwords do not match.");

    const existing = await UserModel.findByEmail(email);
    if (existing) throw validationError("An account with this email already exists.");

    const wantsOrganiser = req.body.signupAsOrganiser === "yes";
    const organiserCode = String(req.body.organiserCode || "").trim();

    let role = "student";
    if (wantsOrganiser) {
      if (!isOrganiserSignupConfigured()) {
        throw validationError(
          "Organiser signup is not enabled on this server (missing ORGANISER_SIGNUP_CODE)."
        );
      }
      if (!organiserCode) {
        throw validationError("Enter the organiser setup code to create an organiser account.");
      }
      if (!verifyOrganiserSignupCode(organiserCode)) {
        throw validationError("Invalid organiser setup code.");
      }
      role = "organiser";
    }

    const passwordHash = await hashPassword(password);
    let user;
    try {
      user = await UserModel.create({
        name,
        email,
        passwordHash,
        role,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw validationError("An account with this email already exists.");
      }
      throw e;
    }

    const csrfSecret = generateCsrfSecret();
    const token = signAuthCookiePayload({
      userId: user._id,
      role: user.role,
      csrfSecret,
    });
    setAuthCookie(res, token);
    res.redirect(
      role === "organiser"
        ? "/organiser?signedup=1"
        : "/courses?signedup=1"
    );
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).render("auth/register", {
        title: "Create account",
        error: err.message,
        organiserSignupConfigured: isOrganiserSignupConfigured(),
        form: {
          name: req.body.name,
          email: req.body.email,
          signupAsOrganiser: req.body.signupAsOrganiser === "yes",
        },
      });
    }
    next(err);
  }
};

export const getLogin = (req, res) => {
  if (req.user) return res.redirect("/");
  const next = String(req.query.next || "/courses");
  const signedUp = req.query.signedup === "1";
  res.render("auth/login", {
    title: "Sign in",
    next,
    form: {},
    signedUp,
  });
};

export const postLogin = async (req, res, next) => {
  try {
    if (req.user) return res.redirect("/");
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    if (!email) {
      return res.status(400).render("auth/login", {
        title: "Sign in",
        error: "Please enter your email address.",
        form: { email: req.body.email },
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).render("auth/login", {
        title: "Sign in",
        error: "Invalid email or password.",
        form: { email: req.body.email },
      });
    }
    if (!user.passwordHash) {
      return res.status(401).render("auth/login", {
        title: "Sign in",
        error:
          "This account has no password on file. Run `npm run seed` for demo users, or register a new account.",
        form: { email: req.body.email },
      });
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).render("auth/login", {
        title: "Sign in",
        error: "Invalid email or password.",
        form: { email: req.body.email },
      });
    }

    const csrfSecret = generateCsrfSecret();
    const token = signAuthCookiePayload({
      userId: user._id,
      role: user.role,
      csrfSecret,
    });
    setAuthCookie(res, token);
    const nextUrl = String(req.body.next || "/courses").replace(/^\/\//, "/");
    res.redirect(nextUrl.startsWith("/") && !nextUrl.startsWith("//") ? nextUrl : "/courses");
  } catch (err) {
    next(err);
  }
};

export const postLogout = (req, res) => {
  clearAuthCookie(res);
  res.redirect("/");
};
