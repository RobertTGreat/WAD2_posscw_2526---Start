// Vercel entry: sync handler + dynamic import so load failures return a response instead of crashing cold start.
// import() is cached; app lives in app.js with export const app (re-export default below).
export default function handler(req, res) {
  import("../app.js")
    .then(({ app }) => {
      app(req, res);
    })
    .catch((err) => {
      console.error("Failed to load Express app:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(
          process.env.NODE_ENV === "production"
            ? "Application failed to start."
            : `Application failed to start: ${err?.message ?? err}`
        );
      }
    });
}
