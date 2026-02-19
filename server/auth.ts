import session from "express-session";
import type { Express, RequestHandler } from "express";
import type { User } from "@shared/models/auth";
import { timingSafeEqual } from "crypto";
import { storage } from "./storage";
import { getSupabaseClient } from "./supabase";

function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());
}

function hasValidApiKey(rawApiKey: string | undefined): boolean {
  const configuredApiKey = process.env.NORWEDFILM_API_KEY || process.env.X_API_KEY;

  if (!configuredApiKey || !rawApiKey) {
    return false;
  }

  const provided = Buffer.from(rawApiKey, "utf8");
  const expected = Buffer.from(configuredApiKey, "utf8");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

let apiKeyCache: { value: string | null; expiresAt: number } = {
  value: null,
  expiresAt: 0,
};

async function getConfiguredApiKey(): Promise<string | null> {
  const now = Date.now();
  if (now < apiKeyCache.expiresAt) {
    return apiKeyCache.value;
  }

  try {
    const setting = await storage.getSetting("norwedfilm_api_key");
    const dbKey = setting?.value?.trim() || null;
    const envKey = process.env.NORWEDFILM_API_KEY || process.env.X_API_KEY || null;

    apiKeyCache = {
      value: dbKey || envKey,
      expiresAt: now + 30_000,
    };
  } catch {
    apiKeyCache = {
      value: process.env.NORWEDFILM_API_KEY || process.env.X_API_KEY || null,
      expiresAt: now + 30_000,
    };
  }

  return apiKeyCache.value;
}

async function hasValidApiKeyAsync(rawApiKey: string | undefined): Promise<boolean> {
  const configuredApiKey = await getConfiguredApiKey();

  if (!configuredApiKey || !rawApiKey) {
    return false;
  }

  const provided = Buffer.from(rawApiKey, "utf8");
  const expected = Buffer.from(configuredApiKey, "utf8");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

function getApiKeyFromRequest(req: Parameters<RequestHandler>[0]): string | undefined {
  const apiKeyHeader = req.header("x-api-key") || undefined;
  const authHeader = req.header("authorization") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  return apiKeyHeader || bearerToken;
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const providedApiKey = getApiKeyFromRequest(req);
  if (await hasValidApiKeyAsync(providedApiKey)) {
    return next();
  }

  const user = (req.session as any)?.user as User | undefined;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

export const isApiKeyAuthenticated: RequestHandler = async (req, res, next) => {
  const providedApiKey = getApiKeyFromRequest(req);
  if (!(await hasValidApiKeyAsync(providedApiKey))) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};

function getSupabaseAuthEnv() {
  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anonKey };
}

function getBaseUrl(req: Parameters<RequestHandler>[0]) {
  return `${req.protocol}://${req.get("host")}`;
}

function getAllowedAdminEmails() {
  const raw = process.env.NORWEDFILM_ADMIN_EMAILS || process.env.NORWEDFILM_ADMIN_EMAIL || "";

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedAdminEmail(email: string) {
  const allowed = getAllowedAdminEmails();
  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(email.toLowerCase());
}

function getSafeNextPath(rawPath: string | undefined): string {
  if (!rawPath) return "/admin";
  if (!rawPath.startsWith("/")) return "/admin";
  if (rawPath.startsWith("//")) return "/admin";
  return rawPath;
}

export function registerAuthRoutes(app: Express): void {
  app.get("/api/login", (_req, res) => {
    res.redirect("/admin/login");
  });

  app.get("/api/login/supabase", (req, res) => {
    const { url, anonKey } = getSupabaseAuthEnv();
    if (!url || !anonKey) {
      return res.redirect("/admin/login?error=supabase_not_configured");
    }

    const nextPath = getSafeNextPath(typeof req.query.next === "string" ? req.query.next : undefined);
    const callbackUrl = new URL("/admin/login/callback", getBaseUrl(req));
    callbackUrl.searchParams.set("next", nextPath);

    const authorizeUrl = new URL("/auth/v1/authorize", url);
    authorizeUrl.searchParams.set("provider", "google");
    authorizeUrl.searchParams.set("flow_type", "implicit");
    authorizeUrl.searchParams.set("redirect_to", callbackUrl.toString());

    return res.redirect(authorizeUrl.toString());
  });

  app.post("/api/auth/supabase/session", async (req, res) => {
    const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";
    if (!accessToken) {
      return res.status(400).json({ message: "Missing access token" });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ message: "Supabase is not configured" });
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid Supabase session" });
    }

    const email = data.user.email?.toLowerCase() || "";
    if (!email) {
      return res.status(401).json({ message: "Supabase user email is missing" });
    }

    if (!isAllowedAdminEmail(email)) {
      return res.status(403).json({ message: "Email is not allowed for admin access" });
    }

    const metadata = data.user.user_metadata || {};
    const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
    const [firstNameFromFull, ...lastNameParts] = fullName.split(" ").filter(Boolean);

    const user: User = {
      id: data.user.id,
      email,
      firstName:
        (typeof metadata.given_name === "string" && metadata.given_name) ||
        firstNameFromFull ||
        "Admin",
      lastName:
        (typeof metadata.family_name === "string" && metadata.family_name) ||
        (lastNameParts.length > 0 ? lastNameParts.join(" ") : null),
      profileImageUrl:
        (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
        (typeof metadata.picture === "string" && metadata.picture) ||
        null,
      createdAt: data.user.created_at ? new Date(data.user.created_at) : null,
      updatedAt: data.user.updated_at ? new Date(data.user.updated_at) : null,
    };

    (req.session as any).user = user;
    res.json(user);
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    res.json((req.session as any).user as User);
  });
}
