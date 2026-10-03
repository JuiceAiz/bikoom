// Vercel serverless entry for GET /api/health.
// The full Express app is mounted here: Vercel passes the original
// request path through, so every route still matches normally.
export { default } from "../server/index.js";
