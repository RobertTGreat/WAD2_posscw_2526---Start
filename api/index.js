// Vercel serverless entry: no listen(); lazy initDb for cold starts
import { app } from "../app.js";
import { initDb } from "../models/_db.js";

let initPromise;

function ensureDbInitialized() {
  if (!initPromise) initPromise = initDb();
  return initPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDbInitialized();
  } catch (err) {
    console.error("initDb failed:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Database initialization failed.");
    }
    return;
  }
  app(req, res);
}
