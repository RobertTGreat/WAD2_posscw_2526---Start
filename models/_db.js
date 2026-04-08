// models/_db.js
import Datastore from "nedb-promises";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { isVercelRuntime } from "../utils/runtime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDbDirectory() {
  if (process.env.NEDB_DATA_DIR) {
    return path.resolve(process.env.NEDB_DATA_DIR);
  }

  if (isVercelRuntime()) {
    return path.join("/tmp", "yoga-nedb");
  }

  return path.join(__dirname, "../db");
}

const dbDir = resolveDbDirectory();

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
