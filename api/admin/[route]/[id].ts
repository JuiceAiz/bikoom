// Vercel serverless entry for /api/admin/:route/:id (product/category/banner
// by-id edits and deletes, order/delivery status patches). Vercel's filesystem
// API routing only matches one segment per [param], so depth-4 paths need
// their own file — a single catch-all entry would 404 here.
export { default } from "../../../server/index.js";
