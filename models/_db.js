// models/_db.js
import Datastore from "nedb-promises";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default: repo `db/`. On Render, mount a disk and set NEDB_DATA_DIR to that path for persistence across deploys.
const dbDir = process.env.NEDB_DATA_DIR
  ? path.resolve(process.env.NEDB_DATA_DIR)
  : path.join(__dirname, "../db");

export const usersDb = Datastore.create({
  filename: path.join(dbDir, "users.db"),
  autoload: true,
});
export const coursesDb = Datastore.create({
  filename: path.join(dbDir, "courses.db"),
  autoload: true,
});
export const sessionsDb = Datastore.create({
  filename: path.join(dbDir, "sessions.db"),
  autoload: true,
});
export const bookingsDb = Datastore.create({
  filename: path.join(dbDir, "bookings.db"),
  autoload: true,
});

// Call this once at startup (server + seed)
export async function initDb() {
  await fs.mkdir(dbDir, { recursive: true });
  // Ensure helpful indexes are ready before we insert
  await usersDb.ensureIndex({ fieldName: "email", unique: true });
  await sessionsDb.ensureIndex({ fieldName: "courseId" });
}
