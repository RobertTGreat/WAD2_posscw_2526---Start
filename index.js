// index.js — local server only; Vercel uses api/index.js
import { app, not_found, server_error } from "./app.js";
import { initDb } from "./models/_db.js";

const runLocalServer =
  process.env.NODE_ENV !== "test" && process.env.VERCEL !== "1";

if (runLocalServer) {
  await initDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Yoga booking running on http://localhost:${PORT}`)
  );
}

export { app, not_found, server_error };
