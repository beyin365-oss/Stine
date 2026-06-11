import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

if (!process.env.REPLIT_DOMAINS && !process.env.ALLOW_NON_REPLIT_AUTH) {
  console.log("Running without Replit OIDC. Email/password auth active.");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  let sessionStore: any;

  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } else {
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({ checkPeriod: 86400000 });
  }

  return session({
    secret: process.env.SESSION_SECRET || "stine-session-secret-change-me-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Custom email/password auth routes (works on Render and everywhere)
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, djName, termsAccepted, termsAcceptedAt } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      if (!termsAccepted) {
        return res.status(400).json({ message: "You must accept the Terms of Service to register" });
      }

      const existing = await (storage as any).getUserByEmail?.(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const userId = `usr_${randomBytes(12).toString("hex")}`;

      const user = await storage.upsertUser({
        id: userId,
        email: email.toLowerCase().trim(),
        firstName: firstName || "",
        lastName: lastName || "",
        djName: djName || null,
        profileImageUrl: null,
      } as any);

      await (storage as any).setUserPassword?.(userId, passwordHash);

      // Save ToS acceptance
      if (termsAccepted) {
        await (storage as any).updateUserTermsAcceptance?.(userId, true, termsAcceptedAt ? new Date(termsAcceptedAt) : new Date());
      }

      const sess = req.session as any;
      sess.userId = userId;
      sess.userEmail = email.toLowerCase().trim();
      sess.userName = firstName || email.split("@")[0];

      res.json({ user, message: "Account created successfully" });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed: " + error.message });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await (storage as any).getUserByEmail?.(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const passwordHash = await (storage as any).getUserPassword?.(user.id);
      if (!passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await comparePasswords(password, passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const sess = req.session as any;
      sess.userId = user.id;
      sess.userEmail = user.email;
      sess.userName = user.firstName || email.split("@")[0];

      res.json({ user, message: "Logged in successfully" });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed: " + error.message });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    const sess = req.session as any;
    sess.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/logout", (req: any, res) => {
    const sess = req.session as any;
    // If Replit OIDC user, do full OIDC logout
    if (process.env.REPLIT_DOMAINS && req.isAuthenticated?.()) {
      req.logout(async () => {
        try {
          const config = await getOidcConfig();
          res.redirect(
            client.buildEndSessionUrl(config, {
              client_id: process.env.REPL_ID!,
              post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
            }).href
          );
        } catch {
          res.redirect("/");
        }
      });
    } else {
      sess.destroy(() => {
        res.redirect("/");
      });
    }
  });

  if (!process.env.REPLIT_DOMAINS) {
    console.log("Replit OIDC disabled on this environment. Using email/password auth.");
    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/login",
    })(req, res, next);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Path 1: Replit OIDC (when running on Replit)
  if (process.env.REPLIT_DOMAINS) {
    const user = req.user as any;
    if (!req.isAuthenticated() || !user?.expires_at) {
      // Also check session-based auth as fallback
      const sess = req.session as any;
      if (sess?.userId) {
        req.user = {
          claims: {
            sub: sess.userId,
            email: sess.userEmail,
            first_name: sess.userName,
            last_name: "",
            profile_image_url: null,
          },
        } as any;
        return next();
      }
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) return next();

    const refreshToken = user.refresh_token;
    if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // Path 2: Custom session auth (Render, other hosting)
  const sess = req.session as any;
  if (!sess?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = {
    claims: {
      sub: sess.userId,
      email: sess.userEmail,
      first_name: sess.userName,
      last_name: "",
      profile_image_url: null,
    },
  } as any;

  return next();
};
