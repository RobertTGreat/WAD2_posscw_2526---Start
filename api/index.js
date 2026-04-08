// Vercel: export the Express app directly (no async wrapper — see Vercel Express guide).
// DB init on Vercel runs in app.js middleware before routes that touch NeDB.
import { app } from "../app.js";

export default app;
