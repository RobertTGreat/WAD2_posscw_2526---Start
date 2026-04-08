import { app } from "./app.js";
import { initDb } from "./models/_db.js";

async function startServer() {
  await initDb();

  const port = process.env.PORT || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Yoga booking listening on port ${port}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}
