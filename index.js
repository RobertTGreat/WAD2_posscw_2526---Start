// index.js — HTTP server entry (Render Web Service, local `npm start`, not used in Jest)
import { app, not_found, server_error } from "./app.js";
import { initDb } from "./models/_db.js";

if (process.env.NODE_ENV !== "test") {
  await initDb();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Yoga booking listening on port ${PORT}`)
  );
}

export { app, not_found, server_error };
