import session from "express-session";
import type { Express, RequestHandler } from "express";
import type { User } from "@shared/models/auth";
import { timingSafeEqual } from "crypto";
import { storage } from "./storage";

const defaultUser: User = {
  id: "local-admin",
  email: "admin@local.dev",
  firstName: "Admin",
  lastName: "Local",
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

export function registerAuthRoutes(app: Express): void {
  app.get("/api/login", (req, res) => {
    (req.session as any).user = defaultUser;
    res.redirect("/");
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
