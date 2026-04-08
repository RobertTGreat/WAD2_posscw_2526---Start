// app.js — shared Express application used by tests, Render, and Vercel
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mustacheExpress from "mustache-express";
import { existsSync } from "fs";
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
import { ensureDemoData } from "./seed/seedDemoData.js";
import { isRenderRuntime, isServerlessRuntime } from "./utils/runtime.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveAppRoot() {
  const candidateRoots = [process.cwd(), __dirname];
  return (
    candidateRoots.find((rootPath) =>
      existsSync(path.join(rootPath, "views", "partials"))
    ) ?? __dirname
  );
}

function shouldAutoSeedDemoData() {
  return process.env.AUTO_SEED_DEMO_DATA === "1" || isServerlessRuntime();
}

async function prepareServerlessRuntime() {
  await initDb();
  if (shouldAutoSeedDemoData()) {
    await ensureDemoData();
  }
}

const appRoot = resolveAppRoot();
let serverlessReadyPromise;

export const app = express();

if (isRenderRuntime() || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.engine(
  "mustache",
  mustacheExpress(path.join(appRoot, "views", "partials"), ".mustache")
);
app.set("view engine", "mustache");
app.set("views", path.join(appRoot, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

if (isServerlessRuntime()) {
  app.use((req, res, next) => {
    if (!serverlessReadyPromise) {
      serverlessReadyPromise = prepareServerlessRuntime();
    }
    serverlessReadyPromise.then(() => next()).catch(next);
  });
}

app.use((req, res, next) => {
  res.locals.year = new Date().getFullYear();
  next();
});

app.use(express.static(path.join(appRoot, "public")));

app.use(loadAuthUser);
app.use(attachFormCsrf);

app.use("/", authRoutes);
app.use("/organiser", organiserRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

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

export default app;
