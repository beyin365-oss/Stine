# STINE Security Audit Report

_Audit Date: June 2026 · Auditor: Platform Engineering Team_  
_Version: 1.0 · Scope: Full-stack codebase (Express API + React SPA)_

---

## Executive Summary

STINE's codebase demonstrates good security foundations with session-based auth, Paystack webhook signature verification, and environment-variable-based secret management. This audit identifies areas requiring attention before production hardening.

**Overall Risk Level: MEDIUM** — No critical vulnerabilities found. Several medium and low findings require remediation.

---

## 1. Authentication & Session Management

### 1.1 Admin Portal Auth Separation ✅ (Fixed in this release)
- **Status**: Resolved
- Admin sessions now stored in `req.session.adminId` separately from user sessions (`req.session.userId`)
- Admin auth flow at `/admin/login` is fully isolated from user auth at `/login`
- Admin routes use `isAdminAuthenticated` middleware — a regular logged-in user cannot access admin endpoints

### 1.2 Founder Bootstrap Security ✅ (Fixed in this release)
- One-time setup endpoint `/api/admin/auth/setup` checks for existing founder before allowing creation
- Disabled permanently once a founder account exists
- Returns generic error on repeated attempts (no enumeration)

### 1.3 Rate Limiting on Admin Login ✅ (Implemented)
- 10 attempts per 15 minutes per IP address
- In-memory rate limiting — adequate for single-instance deployments
- **Recommendation**: Use Redis-backed rate limiting for multi-instance Render deployments

### 1.4 Session Secret ✅
- `SESSION_SECRET` loaded from environment variable
- **Finding (LOW)**: Session secret should be rotated periodically. Current implementation has no rotation mechanism.
- **Recommendation**: Document session secret rotation procedure

### 1.5 Session Cookie Flags
- **Finding (MEDIUM)**: Verify that `sameSite: 'lax'` and `secure: true` are enforced in production
- **Recommendation**: Add explicit cookie config in session setup:
  ```typescript
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000  // 8 hours for admin sessions
  }
  ```

### 1.6 Password Storage ✅
- Passwords hashed with `scrypt` (secure, memory-hard) + random 16-byte salt
- Timing-safe comparison using `timingSafeEqual` — prevents timing attacks
- **Recommendation**: Enforce minimum password complexity server-side (currently only length ≥ 8)

### 1.7 Password Reset Tokens ✅ (Implemented)
- 32-byte cryptographically random tokens
- 1-hour expiration
- Single-use (deleted after use)
- **Finding (LOW)**: Tokens stored in-memory — lost on server restart. Use DB-backed storage for production.
- **Recommendation**: Store reset tokens in PostgreSQL with `expires_at` column

---

## 2. API Security

### 2.1 Input Validation
- **Finding (MEDIUM)**: Many endpoints accept `any` typed request body without schema validation
- Subscription/payment endpoints do basic checks but could be stricter
- **Recommendation**: Add Zod validation schemas to all mutation endpoints
- Example:
  ```typescript
  const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
  const { email, password } = loginSchema.parse(req.body); // throws on invalid input
  ```

### 2.2 SQL Injection
- **Status**: Not applicable — Drizzle ORM with parameterized queries used throughout
- `sql` template literal in `updateStreamListenerCount` is correctly parameterized
- **Risk**: Low

### 2.3 NoSQL Injection (MongoDB)
- **Finding (LOW)**: Some MongoDB queries use direct user input
- Example: `kycVerifications.findOne({ userId })` — userId comes from session (safe)
- **Recommendation**: Always validate/sanitize MongoDB query parameters from request body

### 2.4 CSRF Protection
- **Finding (MEDIUM)**: No CSRF tokens on state-changing endpoints
- Session cookies are `httpOnly` which mitigates some risk, but CSRF tokens should be added for financial endpoints
- **Recommendation**: Add `csurf` middleware or use double-submit cookie pattern for:
  - `/api/paystack/initialize`
  - `/api/admin/payout/:id/approve`
  - `/api/admin/verification/:id`

### 2.5 Paystack Webhook Verification ✅
- HMAC-SHA512 signature verification correctly implemented
- Timing-safe comparison via Node.js crypto module
- **Risk**: Low

### 2.6 Authorization on Admin Endpoints
- All admin routes protected by `isAdmin` middleware (email check or role check)
- **Finding (MEDIUM)**: `isAdmin` uses `isAuthenticated` which checks user session — not admin session
- **Status**: New admin endpoints use `isAdminAuthenticated` (resolved for new routes)
- **Recommendation**: Migrate ALL existing `/api/admin/*` routes to `isAdminAuthenticated` in a follow-up pass

### 2.7 File Upload Security
- **Finding (HIGH)**: If file upload functionality is added (DJ tracks, profile images), it must include:
  - File type validation (magic bytes, not just extension)
  - File size limits
  - Virus scanning (ClamAV or cloud service)
  - Storage in object storage (not local filesystem) — already planned via Replit Object Storage

### 2.8 Rate Limiting on Public Endpoints
- **Finding (MEDIUM)**: Public endpoints (`/api/auth/login`, `/api/paystack/verify`) have no rate limiting
- **Recommendation**: Add `express-rate-limit` middleware to:
  - All `/api/auth/*` routes: 20 requests/minute
  - Payment endpoints: 10 requests/minute
  - All endpoints: 100 requests/minute general limit

---

## 3. Secrets Management

### 3.1 Environment Variables ✅
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — env vars
- `SESSION_SECRET` — env var
- `DATABASE_URL`, `MONGODB_URI` — env vars
- No hardcoded secrets found in codebase

### 3.2 Client-Side Secret Exposure
- **Finding (LOW)**: Paystack public key is exposed to client via `/api/paystack/public-key` — this is correct behavior (public keys are meant to be public)
- **Finding (LOW)**: `OWNER_EMAIL` hardcoded in both `server/routes.ts` and `client/src/pages/admin.tsx`
- **Recommendation**: Remove `OWNER_EMAIL` from client bundle. Move to server-side only. Admin auth now uses role-based check which doesn't need the email in client.

### 3.3 GitHub Secret Scanning
- **Recommendation**: Enable GitHub secret scanning and push protection
- Ensure `.env` and `.env.*` are in `.gitignore`

---

## 4. Transport Security

### 4.1 HTTPS ✅
- Render enforces HTTPS on all production deployments
- The reverse proxy terminates TLS

### 4.2 HSTS
- **Recommendation**: Add Strict-Transport-Security header:
  ```typescript
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
  ```

### 4.3 Security Headers
- **Finding (MEDIUM)**: Several security headers are missing
- **Recommendation**: Add `helmet` middleware:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], mediaSrc: ["'self'", "blob:"] }},
    crossOriginEmbedderPolicy: false,
  }));
  ```
  Missing headers to add: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`

---

## 5. Data Privacy & Compliance

### 5.1 Nigerian Data Protection Regulation (NDPR) / NDPR 2.0
- **Finding (HIGH — Regulatory)**: NDPR requires explicit consent for data collection and processing
- **Requirements**:
  - [ ] Privacy notice at registration
  - [ ] Consent checkbox for marketing communications
  - [ ] Data deletion mechanism (right to erasure)
  - [ ] Data portability (export user data)
  - [ ] Data Protection Officer (DPO) designated
  - [ ] Data audit trail

### 5.2 GDPR (If serving EU users)
- Similar requirements to NDPR
- Cookie consent banner required for web
- **Recommendation**: If any EU users are anticipated, add cookie consent and privacy controls

### 5.3 PCI DSS (Payment Card Industry)
- STINE does not store card data (Paystack handles this)
- Paystack is PCI DSS Level 1 certified
- **Risk**: Low — STINE is not in PCI scope

---

## 6. WebSocket Security

### 6.1 Chat Message Authentication
- **Finding (MEDIUM)**: WebSocket `chat_message` handler uses `message.userId` from the client — not from the server-side session
- **Risk**: Any connected client could spoof messages as another user
- **Recommendation**: Authenticate WebSocket connections on upgrade using session cookie:
  ```typescript
  wss.on('connection', (ws, req) => {
    // Parse session from req to get authenticated userId
    // Store authenticated userId on ws object
    // Use ws.userId instead of message.userId in chat_message handler
  });
  ```

### 6.2 Message Rate Limiting
- **Finding (LOW)**: No rate limiting on WebSocket chat messages
- **Recommendation**: Limit to 1 message per second per connection

---

## 7. Dependency Audit

### 7.1 Known Vulnerabilities
- **Recommendation**: Run `pnpm audit` and resolve any high/critical advisories before go-live
- Key dependencies to monitor: `express`, `ws`, `drizzle-orm`, `mongodb`

### 7.2 Dependency Pinning
- **Recommendation**: Pin production dependencies in `package.json` (use exact versions or `~` range, not `^`)

---

## 8. Findings Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Admin portal auth separation | MEDIUM | ✅ Fixed |
| 2 | Founder bootstrap security | MEDIUM | ✅ Fixed |
| 3 | Rate limiting on admin login | MEDIUM | ✅ Implemented |
| 4 | Missing CSRF protection | MEDIUM | ⚠️ Open |
| 5 | WebSocket userId spoofing | MEDIUM | ⚠️ Open |
| 6 | Missing security headers | MEDIUM | ⚠️ Open |
| 7 | NDPR compliance gap | HIGH (regulatory) | ⚠️ Open |
| 8 | File upload security (future) | HIGH (if added) | ⚠️ Planned |
| 9 | Input validation on mutations | MEDIUM | ⚠️ Open |
| 10 | Rate limiting on public endpoints | MEDIUM | ⚠️ Open |
| 11 | Session cookie flags | LOW | ⚠️ Open |
| 12 | Password reset tokens in-memory | LOW | ⚠️ Open |
| 13 | OWNER_EMAIL in client bundle | LOW | ⚠️ Open |
| 14 | Multi-instance rate limiting | LOW | ⚠️ Future |
| 15 | HSTS header missing | LOW | ⚠️ Open |

---

## 9. Recommended Immediate Actions (Before Public Launch)

1. **Add `helmet` middleware** — 30 minute task, high impact
2. **Implement CSRF tokens** on payment and admin endpoints — 2 hours
3. **Fix WebSocket userId authentication** — 1 hour
4. **Add Zod validation** to all mutation endpoints — 1 day
5. **Add `express-rate-limit`** on public endpoints — 1 hour
6. **NDPR compliance**: Draft privacy policy, add consent checkbox, data deletion endpoint — 1 week
7. **Run `pnpm audit`** and resolve high/critical advisories

---

## 10. 2FA Groundwork (Foundation Ready)

The following groundwork has been laid for 2FA in this release:

- Admin accounts are separate from user accounts with dedicated session tracking
- `adminAuth.ts` has the structure to add TOTP/OTP verification as a second step in the login flow
- To complete 2FA implementation:
  1. Install `speakeasy` or `otpauth` for TOTP generation/verification
  2. Add `twoFaSecret` and `twoFaEnabled` fields to admin accounts
  3. Add `/api/admin/auth/2fa/setup` and `/api/admin/auth/2fa/verify` endpoints
  4. Add 2FA prompt step in `AdminLoginPage` after password is verified

---

_This report should be reviewed by the founding team. High and medium findings should be prioritized for the next sprint before opening the platform to the public._
