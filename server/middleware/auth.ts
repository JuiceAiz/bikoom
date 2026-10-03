import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { config, missingEnv } from "../config.js";
import { getSupabase } from "../lib/supabase.js";

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

/** Block API writes until Supabase credentials exist. */
function envGuard(res: Response): boolean {
  const missing = missingEnv();
  if (missing.length > 0) {
    res.status(503).json({
      error: "Server is not configured yet. Add Supabase credentials to .env",
      missing,
    });
    return false;
  }
  return true;
}

async function readUser(req: Request): Promise<User | null> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Attach the customer when a session token is present, but never block:
 * browsing and ordering work without signing in (guest requests are
 * stored with user_id = null).
 */
export async function optionalAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!envGuard(res)) return;
  const user = await readUser(req);
  if (user) {
    req.userId = user.id;
    req.userEmail = user.email ?? undefined;
  }
  next();
}

/**
 * Require an administrator: profiles.is_admin in Supabase, or an email listed
 * in the ADMIN_EMAILS env var (checked first as a bootstrap fallback).
 */
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!envGuard(res)) return;
  const user = await readUser(req);
  if (!user) {
    res.status(401).json({ error: "Sign-in required." });
    return;
  }

  const email = (user.email ?? "").toLowerCase();
  let isAdmin = config.adminEmails.includes(email);

  if (!isAdmin) {
    const { data } = await getSupabase()
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = Boolean(data?.is_admin);
  }

  if (!isAdmin) {
    res.status(403).json({
      error: "Admin access required. Ask Bikoom to enable your account.",
    });
    return;
  }

  req.userId = user.id;
  req.userEmail = user.email ?? undefined;
  req.isAdmin = true;
  next();
}
