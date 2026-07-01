import { randomBytes, scrypt, timingSafeEqual, createHmac } from "crypto";
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

// ── In-memory stores ─────────────────────────────────────────────────────────
// { token -> { adminId, expiresAt } }
const resetTokens = new Map<string, { adminId: string; expiresAt: number }>();
// { ip -> { count, resetAt } }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
// { userId -> TOTP data }
const totpStore = new Map<string, { secret: string; enabled: boolean; pendingSecret?: string; recoveryCodes: string[] }>();
// Pending 2FA logins: { tempToken -> { adminId, expiresAt } }
const pending2FALogins = new Map<string, { adminId: string; expiresAt: number }>();

// ── Rate Limiting ─────────────────────────────────────────────────────────────
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

// ── TOTP (RFC 6238 / RFC 4226) ───────────────────────────────────────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  const buf = Buffer.alloc(Math.ceil((clean.length * 5) / 8));
  let bits = 0, value = 0, index = 0;
  for (const c of clean) {
    const v = BASE32_CHARS.indexOf(c);
    if (v < 0) continue;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      buf[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return buf.slice(0, index);
}

function computeHOTP(secretBuf: Buffer, counter: bigint): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(counter);
  const mac = createHmac("sha1", secretBuf).update(counterBuf).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const code =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

export function verifyAdminTOTP(adminId: string, token: string): boolean {
  const data = totpStore.get(adminId);
  if (!data || !data.enabled || !data.secret) return false;
  return verifyTOTP(data.secret, token);
}

export function verifyTOTP(secret: string, token: string, windowSize = 1): boolean {
  if (!secret || !token || token.length !== 6) return false;
  try {
    const secretBuf = base32Decode(secret);
    const counter = BigInt(Math.floor(Date.now() / 1000 / 30));
    for (let i = -windowSize; i <= windowSize; i++) {
      if (computeHOTP(secretBuf, counter + BigInt(i)) === token) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function generateTOTPSecret(adminEmail: string): { secret: string; otpauthUrl: string } {
  const secretBuf = randomBytes(20);
  const secret = base32Encode(secretBuf);
  const issuer = "STINE+Admin";
  const label = encodeURIComponent(`STINE Admin:${adminEmail}`);
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  return { secret, otpauthUrl };
}

function generateRecoveryCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const a = randomBytes(4).toString("hex").toUpperCase();
    const b = randomBytes(4).toString("hex").toUpperCase();
    return `${a}-${b}`;
  });
}

function getTotpData(userId: string) {
  if (!totpStore.has(userId)) {
    totpStore.set(userId, { secret: "", enabled: false, recoveryCodes: [] });
  }
  return totpStore.get(userId)!;
}

// ── Role constants ────────────────────────────────────────────────────────────
const ADMIN_ROLES = ["founder", "super_admin", "admin", "moderator"];

// ── Middleware ────────────────────────────────────────────────────────────────
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

// ── Route registration ────────────────────────────────────────────────────────
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
      if (users.some((u: any) => u.role === "founder")) {
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
      try { await (storage as any).updateUserExtra?.(userId, { middleName, username }); } catch {}

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

      // Check if 2FA is enabled for this admin
      const totp = getTotpData(user.id);
      if (totp.enabled && totp.secret) {
        // Issue a short-lived temp token for the 2FA step
        const tempToken = randomBytes(32).toString("hex");
        pending2FALogins.set(tempToken, { adminId: user.id, expiresAt: Date.now() + 5 * 60 * 1000 });
        await logAdminAction(user.id, "login_2fa_required", { email }, req);
        return res.json({ requires2FA: true, tempToken });
      }

      // No 2FA — complete login
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
      const totp = getTotpData(sess.adminId);
      res.json({ ...sanitize(admin), twoFaEnabled: totp.enabled });
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
      if (!user || !ADMIN_ROLES.includes((user as any).role || "")) {
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }

      const token = randomBytes(32).toString("hex");
      resetTokens.set(token, { adminId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 });

      console.log(`[ADMIN PASSWORD RESET] Token for ${email}: ${token}`);
      await logAdminAction(user.id, "password_reset_requested", { email }, req);

      res.json({
        message: "Password reset token generated. Check server logs or your email.",
        ...(process.env.NODE_ENV !== "production" ? { devToken: token, note: "In production this would be emailed" } : {}),
      });
    } catch {
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

      await (storage as any).setUserPassword?.(entry.adminId, await hashPassword(newPassword));
      resetTokens.delete(token);

      await logAdminAction(entry.adminId, "password_reset_success", {}, req);
      res.json({ message: "Password reset successfully. Please log in." });
    } catch {
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // ── TOTP: Generate setup secret ──────────────────────────────────────
  app.post("/api/admin/auth/totp/setup", isAdminAuthenticated, async (req: any, res: any) => {
    try {
      const admin = (req as any).admin;
      const email = admin.email || "admin";
      const { secret, otpauthUrl } = generateTOTPSecret(email);

      // Store as pending (not yet enabled) until verified
      const data = getTotpData(admin.id);
      data.pendingSecret = secret;
      totpStore.set(admin.id, data);

      await logAdminAction(admin.id, "totp_setup_started", {}, req);
      res.json({
        secret,
        otpauthUrl,
        instructions: "Scan the QR code or enter the secret in your authenticator app (Google Authenticator, Authy, 1Password, etc.), then call /api/admin/auth/totp/enable with a valid 6-digit code to activate 2FA.",
      });
    } catch {
      res.status(500).json({ message: "Failed to generate 2FA secret" });
    }
  });

  // ── TOTP: Enable (verify pending secret) ────────────────────────────
  app.post("/api/admin/auth/totp/enable", isAdminAuthenticated, async (req: any, res: any) => {
    try {
      const admin = (req as any).admin;
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "6-digit code required" });

      const data = getTotpData(admin.id);
      if (!data.pendingSecret) {
        return res.status(400).json({ message: "No pending 2FA setup found. Call /api/admin/auth/totp/setup first." });
      }

      if (!verifyTOTP(data.pendingSecret, String(code).trim())) {
        return res.status(401).json({ message: "Invalid code. Please try again." });
      }

      // Promote pending → enabled
      const recoveryCodes = generateRecoveryCodes();
      data.secret = data.pendingSecret;
      data.pendingSecret = undefined;
      data.enabled = true;
      data.recoveryCodes = recoveryCodes.map(c => `hash:${createHmac("sha256", "stine-rc").update(c).digest("hex")}|raw:${c}`);
      totpStore.set(admin.id, data);

      await logAdminAction(admin.id, "totp_enabled", {}, req);
      res.json({
        message: "Two-factor authentication enabled successfully.",
        recoveryCodes,
        warning: "Save these recovery codes now. They cannot be shown again. Each code can be used once if you lose access to your authenticator app.",
      });
    } catch {
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  // ── TOTP: Complete login with 2FA code ───────────────────────────────
  app.post("/api/admin/auth/totp/verify-login", async (req: any, res: any) => {
    try {
      const { tempToken, code, rememberMe } = req.body;
      if (!tempToken || !code) return res.status(400).json({ message: "tempToken and code required" });

      const pending = pending2FALogins.get(tempToken);
      if (!pending || Date.now() > pending.expiresAt) {
        return res.status(401).json({ message: "Login session expired. Please log in again." });
      }

      const data = getTotpData(pending.adminId);

      // Try TOTP code first
      if (verifyTOTP(data.secret, String(code).trim())) {
        pending2FALogins.delete(tempToken);
        const user = await storage.getUser(pending.adminId);
        if (!user) return res.status(401).json({ message: "Admin not found" });

        const sess = req.session as any;
        sess.adminId = user.id;
        sess.adminRole = (user as any).role;
        if (rememberMe) (req.session as any).cookie.maxAge = 30 * 24 * 60 * 60 * 1000;

        await logAdminAction(user.id, "login_2fa_success", {}, req);
        return res.json({ message: "Logged in successfully", user: sanitize(user), role: (user as any).role });
      }

      // Try recovery code
      const normalised = String(code).trim().toUpperCase();
      const rcIndex = data.recoveryCodes.findIndex(rc => rc.includes(`raw:${normalised}`));
      if (rcIndex !== -1) {
        // Burn the used recovery code
        data.recoveryCodes.splice(rcIndex, 1);
        totpStore.set(pending.adminId, data);
        pending2FALogins.delete(tempToken);

        const user = await storage.getUser(pending.adminId);
        if (!user) return res.status(401).json({ message: "Admin not found" });

        const sess = req.session as any;
        sess.adminId = user.id;
        sess.adminRole = (user as any).role;

        await logAdminAction(user.id, "login_recovery_code_used", { codesRemaining: data.recoveryCodes.length }, req);
        return res.json({
          message: "Logged in with recovery code.",
          user: sanitize(user),
          role: (user as any).role,
          warning: `Recovery code used. ${data.recoveryCodes.length} code(s) remaining.`,
        });
      }

      await logAdminAction(pending.adminId, "login_2fa_failed", {}, req);
      return res.status(401).json({ message: "Invalid code or recovery code." });
    } catch {
      res.status(500).json({ message: "2FA verification failed" });
    }
  });

  // ── TOTP: Disable 2FA ────────────────────────────────────────────────
  app.post("/api/admin/auth/totp/disable", isAdminAuthenticated, async (req: any, res: any) => {
    try {
      const admin = (req as any).admin;
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Current 2FA code required to disable" });

      const data = getTotpData(admin.id);
      if (!data.enabled) return res.status(400).json({ message: "2FA is not enabled" });

      if (!verifyTOTP(data.secret, String(code).trim())) {
        return res.status(401).json({ message: "Invalid code" });
      }

      data.secret = "";
      data.enabled = false;
      data.recoveryCodes = [];
      data.pendingSecret = undefined;
      totpStore.set(admin.id, data);

      await logAdminAction(admin.id, "totp_disabled", {}, req);
      res.json({ message: "Two-factor authentication disabled." });
    } catch {
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  // ── TOTP: Status ─────────────────────────────────────────────────────
  app.get("/api/admin/auth/totp/status", isAdminAuthenticated, async (req: any, res: any) => {
    const admin = (req as any).admin;
    const data = getTotpData(admin.id);
    res.json({
      enabled: data.enabled,
      recoveryCodesRemaining: data.recoveryCodes.length,
      hasPendingSetup: !!data.pendingSecret,
    });
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
