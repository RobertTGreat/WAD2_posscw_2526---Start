// index.js — register SSR routes before JSON mounts so GET /courses serves HTML
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mustacheExpress from "mustache-express";
import path from "path";
import { fileURLToPath } from "url";

import courseRoutes from "./routes/courses.js";
import sessionRoutes from "./routes/sessions.js";
import bookingRoutes from "./routes/bookings.js";
import viewRoutes from "./routes/views.js";
import authRoutes from "./routes/auth.js";
import organiserRoutes from "./routes/organiser.js";
import { loadAuthUser } from "./middleware/auth.js";
import { attachFormCsrf } from "./middleware/csrfForm.js";
import { initDb } from "./models/_db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.engine(
  "mustache",
  mustacheExpress(path.join(__dirname, "views", "partials"), ".mustache")
);
app.set("view engine", "mustache");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.year = new Date().getFullYear();
  next();
});

app.use("/static", express.static(path.join(__dirname, "public")));

app.use(loadAuthUser);
app.use(attachFormCsrf);

app.use("/", authRoutes);
app.use("/organiser", organiserRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

// HTML pages must register before /courses JSON router (same path)
app.use("/", viewRoutes);

app.use("/api/courses", courseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/bookings", bookingRoutes);

export const not_found = (req, res) =>
  res.status(404).type("text/plain").send("404 Not found.");
export const server_error = (err, req, res, next) => {
  console.error(err);
  res.status(500).type("text/plain").send("Internal Server Error.");
};
app.use(not_found);
app.use(server_error);

if (process.env.NODE_ENV !== "test") {
  await initDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Yoga booking running on http://localhost:${PORT}`)
  );
}
