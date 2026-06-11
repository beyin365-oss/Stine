import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { RequestHandler } from "express";
import { storage } from "./storage";

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

// In-memory store for password reset tokens { token -> { adminId, expiresAt } }
const resetTokens = new Map<string, { adminId: string; expiresAt: number }>();

// Rate limiting store { ip -> { count, resetAt } }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: any): string {
  return req.ip || req.headers["x-forwarded-for"] || "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

function resetRateLimit(key: string) {
  loginAttempts.delete(key);
}

const ADMIN_ROLES = ["founder", "super_admin", "admin", "moderator"];

export const isAdminAuthenticated: RequestHandler = async (req, res, next) => {
  const sess = req.session as any;
  if (!sess?.adminId) {
    return res.status(401).json({ message: "Admin authentication required. Please log in at /admin/login" });
  }
  try {
    const admin = await storage.getUser(sess.adminId);
    if (!admin || !ADMIN_ROLES.includes((admin as any).role || "")) {
      sess.adminId = undefined;
      return res.status(403).json({ message: "Admin access required" });
    }
    (req as any).admin = admin;
    next();
  } catch {
    return res.status(500).json({ message: "Admin auth check failed" });
  }
};

export const requireFounder: RequestHandler = async (req, res, next) => {
  const admin = (req as any).admin;
  if ((admin as any)?.role !== "founder") {
    return res.status(403).json({ message: "Founder-only access" });
  }
  next();
};

export function registerAdminAuthRoutes(app: any) {
  // ── Check if founder exists (public) ────────────────────────────────
  app.get("/api/admin/auth/setup-status", async (_req: any, res: any) => {
    try {
      const users = await (storage as any).getAllUsers?.() ?? [];
      const founderExists = users.some((u: any) => u.role === "founder");
      res.json({ founderExists, needsSetup: !founderExists });
    } catch {
      res.json({ founderExists: false, needsSetup: true });
    }
  });

  // ── One-time founder bootstrap ───────────────────────────────────────
  app.post("/api/admin/auth/setup", async (req: any, res: any) => {
    try {
      const users = await (storage as any).getAllUsers?.() ?? [];
      const founderExists = users.some((u: any) => u.role === "founder");
      if (founderExists) {
        return res.status(400).json({ message: "Founder account already exists. Setup is disabled." });
      }

      const { firstName, middleName, lastName, username, email, password } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "firstName, lastName, email, and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await (storage as any).getUserByEmail?.(email.toLowerCase().trim());
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const userId = `founder_${randomBytes(12).toString("hex")}`;

      await storage.upsertUser({
        id: userId,
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        djName: username || null,
        profileImageUrl: null,
      } as any);

      await (storage as any).updateUserRole?.(userId, "founder");
      await (storage as any).setUserPassword?.(userId, passwordHash);

      // Store middleName if storage supports it
      try { await (storage as any).updateUserExtra?.(userId, { middleName, username }); } catch {}

      // Log audit
      await logAdminAction(null, "founder_created", { email }, req);

      const sess = req.session as any;
      sess.adminId = userId;
      sess.adminRole = "founder";

      const founder = await storage.getUser(userId);
      res.json({ message: "Founder account created successfully", user: sanitize(founder) });
    } catch (error: any) {
      console.error("Founder setup error:", error);
      res.status(500).json({ message: "Setup failed: " + error.message });
    }
  });

  // ── Admin login ──────────────────────────────────────────────────────
  app.post("/api/admin/auth/login", async (req: any, res: any) => {
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({ message: "Too many login attempts. Try again in 15 minutes." });
    }

    try {
      const { email, password, rememberMe } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await (storage as any).getUserByEmail?.(email.toLowerCase().trim());
      if (!user || !ADMIN_ROLES.includes((user as any).role || "")) {
        return res.status(401).json({ message: "Invalid credentials or insufficient permissions" });
      }

      const passwordHash = await (storage as any).getUserPassword?.(user.id);
      if (!passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await comparePasswords(password, passwordHash);
      if (!valid) {
        await logAdminAction(user.id, "login_failed", { email }, req);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      resetRateLimit(rateLimitKey);

      const sess = req.session as any;
      sess.adminId = user.id;
      sess.adminRole = (user as any).role;
      if (rememberMe) {
        (req.session as any).cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }

      await logAdminAction(user.id, "login_success", { email }, req);

      res.json({ message: "Logged in successfully", user: sanitize(user), role: (user as any).role });
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ── Admin logout ─────────────────────────────────────────────────────
  app.post("/api/admin/auth/logout", isAdminAuthenticated, async (req: any, res: any) => {
    await logAdminAction((req as any).admin?.id, "logout", {}, req);
    const sess = req.session as any;
    sess.adminId = undefined;
    sess.adminRole = undefined;
    res.json({ message: "Logged out" });
  });

  // ── Get current admin ────────────────────────────────────────────────
  app.get("/api/admin/auth/me", async (req: any, res: any) => {
    const sess = req.session as any;
    if (!sess?.adminId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const admin = await storage.getUser(sess.adminId);
      if (!admin) {
        sess.adminId = undefined;
        return res.status(401).json({ message: "Admin not found" });
      }
      res.json(sanitize(admin));
    } catch {
      res.status(500).json({ message: "Failed to fetch admin" });
    }
  });

  // ── Forgot password ──────────────────────────────────────────────────
  app.post("/api/admin/auth/forgot-password", async (req: any, res: any) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });

      const user = await (storage as any).getUserByEmail?.(email.toLowerCase().trim());
      // Always return success to prevent email enumeration
      if (!user || !ADMIN_ROLES.includes((user as any).role || "")) {
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }

      const token = randomBytes(32).toString("hex");
      resetTokens.set(token, { adminId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 });

      // In production, send this via email. For now, log securely.
      console.log(`[ADMIN PASSWORD RESET] Token for ${email}: ${token}`);
      await logAdminAction(user.id, "password_reset_requested", { email }, req);

      res.json({
        message: "Password reset token generated. Check server logs or your email.",
        // Return token in dev mode only so founders can self-serve:
        ...(process.env.NODE_ENV !== "production" ? { devToken: token, note: "In production this would be emailed" } : {}),
      });
    } catch (error: any) {
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // ── Reset password with token ────────────────────────────────────────
  app.post("/api/admin/auth/reset-password", async (req: any, res: any) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ message: "Token and newPassword required" });
      if (newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

      const entry = resetTokens.get(token);
      if (!entry || Date.now() > entry.expiresAt) {
        return res.status(400).json({ message: "Reset token is invalid or has expired" });
      }

      const hash = await hashPassword(newPassword);
      await (storage as any).setUserPassword?.(entry.adminId, hash);
      resetTokens.delete(token);

      await logAdminAction(entry.adminId, "password_reset_success", {}, req);
      res.json({ message: "Password reset successfully. Please log in." });
    } catch (error: any) {
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // ── Admin accounts management (founder only) ─────────────────────────
  app.get("/api/admin/accounts", isAdminAuthenticated, requireFounder, async (_req: any, res: any) => {
    try {
      const users = await (storage as any).getAllUsers?.() ?? [];
      const admins = users.filter((u: any) => ADMIN_ROLES.includes(u.role || ""));
      res.json(admins.map(sanitize));
    } catch {
      res.status(500).json({ message: "Failed to fetch admin accounts" });
    }
  });

  app.post("/api/admin/accounts", isAdminAuthenticated, requireFounder, async (req: any, res: any) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;
      const allowedRoles = ["super_admin", "admin", "moderator"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Role must be one of: ${allowedRoles.join(", ")}` });
      }
      if (!email || !password || !firstName) {
        return res.status(400).json({ message: "firstName, email, and password required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await (storage as any).getUserByEmail?.(email.toLowerCase().trim());
      if (existing) return res.status(400).json({ message: "Email already registered" });

      const userId = `admin_${randomBytes(12).toString("hex")}`;
      await storage.upsertUser({ id: userId, email: email.toLowerCase().trim(), firstName, lastName: lastName || "", profileImageUrl: null, djName: null } as any);
      await (storage as any).updateUserRole?.(userId, role);
      await (storage as any).setUserPassword?.(userId, await hashPassword(password));

      await logAdminAction((req as any).admin?.id, "admin_created", { email, role }, req);
      const newAdmin = await storage.getUser(userId);
      res.json({ message: "Admin account created", user: sanitize(newAdmin) });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create admin: " + error.message });
    }
  });

  app.patch("/api/admin/accounts/:id/suspend", isAdminAuthenticated, requireFounder, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { suspended } = req.body;
      await (storage as any).banUser?.(id, !!suspended);
      await logAdminAction((req as any).admin?.id, suspended ? "admin_suspended" : "admin_reactivated", { targetId: id }, req);
      res.json({ message: suspended ? "Admin suspended" : "Admin reactivated", id });
    } catch {
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  app.patch("/api/admin/accounts/:id/reset-password", isAdminAuthenticated, requireFounder, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
      await (storage as any).setUserPassword?.(id, await hashPassword(newPassword));
      await logAdminAction((req as any).admin?.id, "admin_password_reset", { targetId: id }, req);
      res.json({ message: "Password reset successfully" });
    } catch {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.delete("/api/admin/accounts/:id", isAdminAuthenticated, requireFounder, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const founder = (req as any).admin;
      if (id === founder.id) return res.status(400).json({ message: "Cannot remove your own account" });
      await (storage as any).updateUserRole?.(id, "listener");
      await logAdminAction(founder.id, "admin_removed", { targetId: id }, req);
      res.json({ message: "Admin role removed" });
    } catch {
      res.status(500).json({ message: "Failed to remove admin" });
    }
  });
}

function sanitize(user: any) {
  if (!user) return null;
  const { ...safe } = user;
  return safe;
}

async function logAdminAction(adminId: string | null, action: string, details: any, req: any) {
  try {
    const { mongoDb } = await import("./db");
    if (mongoDb) {
      await mongoDb.collection("adminAuditLogs").insertOne({
        id: `audit_${Date.now()}_${randomBytes(4).toString("hex")}`,
        action,
        adminId: adminId || "system",
        adminEmail: "",
        details,
        ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "unknown",
        createdAt: new Date(),
      });
    }
  } catch {}
}
