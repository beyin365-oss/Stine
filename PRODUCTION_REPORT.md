# STINE Production Readiness Report
_Generated: June 2026_

---

## 1. Environment Variables

### SESSION_SECRET

**Required: YES**

Used in `server/replitAuth.ts` to sign and verify session cookies via `express-session`. Without a strong value, sessions can be forged.

**Add to Render:**
```
SESSION_SECRET = <generate a strong 64-character random string>
```

To generate a secure value, run this command locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Example output (DO NOT use this exact value):
`a3f8c1d2e5b07f9a...` (64 hex chars)

**JWT_SECRET: NOT REQUIRED**

The current authentication system uses `express-session` with session cookies. JWT is not used anywhere in the codebase. You do not need to set `JWT_SECRET`.

---

### Complete Environment Variables for Render

| Variable | Required | Purpose |
|----------|----------|---------|
| `SESSION_SECRET` | **Required** | Signs admin + user sessions |
| `DATABASE_URL` | **Required** | PostgreSQL connection string (Neon or Render Postgres) |
| `PAYSTACK_SECRET_KEY` | Required for live payments | Enables Paystack API + payouts |
| `PAYSTACK_PUBLIC_KEY` | Required for live payments | Shown on frontend checkout |
| `MONGODB_URI` | Recommended | Audit logs, KYC, wallets, fraud detection |
| `OPENAI_API_KEY` | Optional | AI categorisation, DJ suggestions |
| `OWNER_EMAIL` | Optional (legacy) | Legacy fallback only, not used for admin auth |

---

## 2. System Health Dashboard Fix

**Root cause of "Unknown" status:** The `/api/admin/health` route was protected by the OLD `isAuthenticated + isAdmin` middleware (user sessions), but the admin portal uses the NEW admin session system. Every health check call returned `401 Unauthorized` — which the frontend showed as "Unknown".

**Fix applied:** Route now uses `isAdminAuthenticated` (admin session middleware).

**Real checks implemented:**
- **PostgreSQL**: `SELECT 1 AS ok` — result is `ok`, `error`, or `not_configured`
- **MongoDB**: `db.command({ ping: 1 })` — result is `ok`, `error`, or `not_configured`
- **Paystack**: Live `GET https://api.paystack.co/balance` API call with your secret key — result is `ok`, `error`, or `not_configured`
- **WebSocket**: Tracks actual connected clients via `wss.clients.size` — result is `ok` once server starts

**Status values displayed:**
- `ok` — service is connected and responding
- `error` — service is configured but unreachable
- `not_configured` — environment variable not set
- No more `unknown` values

---

## 3. Admin Access Removed from User Application

**What was removed:**
- `Shield` icon button in desktop header (visible to `role=admin` or owner email)
- "Owner Dashboard" button in mobile hamburger menu
- `OWNER_EMAIL` constant from navigation component
- `isOwner` variable and logic

**What this means:** Regular users — no matter their email or role — cannot see, click, or navigate to `/admin` from within the app. The admin portal is now accessible exclusively by:
1. Knowing the URL: `/admin/login`
2. Having valid admin credentials

**Industry alignment:** Matches the Spotify / Apple Music / YouTube Music / Boomplay pattern where admin systems are invisible to end users.

---

## 4. Role Dashboard Verification

### Listener Dashboard ✅
- Subscription tier display (Free / Basic / Pro / Premium)
- Download quota with visual progress bar
- Quick links: Discover, Library, Live Streams, Upgrade

### DJ Dashboard ✅
- Stats: Total tracks, play count, downloads, listeners
- Wallet balance with payout request link
- Verification status banner (pending / approved / rejected)
- Go Live button
- Track upload shortcut

### Broadcaster Dashboard ✅
- Live stream status (active / no stream)
- Analytics: Audience reached, streams this month, total hours, revenue
- Revenue breakdown card
- Start broadcasting button

### Hybrid DJ + Broadcaster Dashboard ✅ (role = `songcreator`)
- Tabbed interface: Overview / DJ Tools / Broadcast / Earnings
- Overview: Combined stats (tracks + plays + audience + revenue)
- DJ Tools tab: Track management, play stats, Go Live
- Broadcast tab: Stream status, audience analytics, stream history
- Earnings tab: Merged wallet, payout actions, monetization breakdown

**Intelligent merge:** When a user holds both DJ and Broadcaster capabilities (`songcreator` role), all tools, analytics, and earnings are presented in a single unified dashboard — no duplication.

---

## 5. Founder Security

### TOTP 2FA (NEW — fully implemented)

**Setup flow:**
1. Log in to admin portal
2. Go to Settings → Security
3. Click "Set Up Two-Factor Authentication"
4. Copy the secret into Google Authenticator, Authy, or 1Password
5. Enter a 6-digit code to verify
6. Save the 8 recovery codes shown (each is single-use)

**2FA login flow:**
1. Enter email + password → server returns `{ requires2FA: true, tempToken }`
2. Enter 6-digit code from authenticator → session established

**Recovery codes:**
- 8 codes generated at setup, format: `XXXXXXXX-XXXXXXXX`
- Each code is single-use (burned after use)
- Remaining count shown in admin portal
- Use any recovery code in the 2FA field if you lose your phone

**Implementation:** Pure RFC 6238 / RFC 4226 TOTP using Node.js built-in `crypto` — no third-party packages required.

### Founder Account Capabilities

| Action | Available |
|--------|-----------|
| Create admin accounts (super_admin / admin / moderator) | ✅ |
| Suspend / reactivate admin accounts | ✅ |
| Reset admin passwords | ✅ |
| Remove admin role from accounts | ✅ |
| Cannot remove own account | ✅ (protected) |
| Recover account via password reset | ✅ |
| Recover account via recovery codes (if 2FA enabled) | ✅ |

---

## 6. Backup & Recovery

### PostgreSQL Backup Strategy

**On Render (Render Postgres):**
- Render creates automatic daily backups. Access via: Dashboard → Your Database → Backups
- Download a manual backup: Dashboard → Your Database → Backups → Create Backup

**On Neon:**
- Neon creates automatic backups with branching (point-in-time recovery)
- Create a branch: `neon branches create --name backup-$(date +%Y%m%d)`
- Restore: `neon branches restore`

**Manual backup (pg_dump):**
```bash
pg_dump $DATABASE_URL > stine_backup_$(date +%Y%m%d).sql
```

**Restore from backup:**
```bash
psql $DATABASE_URL < stine_backup_20260611.sql
```

### Founder Account Recovery

**Scenario 1: Forgot password**
1. Visit `/admin/login` → click "Forgot password?"
2. Enter your founder email
3. Server logs a reset token to `Render Logs` (search: `ADMIN PASSWORD RESET`)
4. Visit `/admin/login` and use the reset-password form with the token

**Scenario 2: Lost 2FA device (have recovery codes)**
1. Visit `/admin/login`
2. Enter email + password
3. When 2FA prompt appears, enter a recovery code (format: `XXXXXXXX-XXXXXXXX`)
4. Code is burned on use

**Scenario 3: Lost 2FA device AND no recovery codes**
1. Connect to your Render Postgres via the Render shell:
   ```sql
   UPDATE users SET role = 'listener' WHERE email = 'your-email@example.com';
   ```
2. This strips the admin role, removing 2FA requirement
3. Re-bootstrap via `/admin/setup` (which works if no founder exists)
   - Or: re-promote via `UPDATE users SET role = 'founder' WHERE id = 'your-id'`
4. Re-run TOTP setup with a new authenticator

### Admin Account Recovery (by Founder)

- Founder can reset any admin's password from the **Admins tab** → Reset Password
- Founder can suspend/unsuspend any admin
- Founder cannot be self-deleted

---

## 7. Mobile Store Readiness

See `MOBILE_READINESS.md` for the full checklist. Summary of blockers:

### Play Store (Android) — No Hard Blockers
- **Privacy Policy URL**: Must be hosted and linked in the store listing
- **App category**: Music & Audio
- **Content rating**: Complete the rating questionnaire (likely Everyone / Teen)
- **Target API level**: Must target Android 14+ (API 34)

### App Store (iOS) — No Hard Blockers
- **Privacy Manifest**: Required for apps using certain APIs (location, contact access, etc.)
- **Export compliance**: Answer encryption question (AES via HTTPS = "Yes, exempt")
- **App Review guidelines 1.1.6**: No user-generated adult content without proper age gates
- **Sign in with Apple**: Required if you offer any third-party login (if you add Google login later)

### Before Submitting Either Store
1. Build production APK/IPA with production API URL (Render domain)
2. Complete GDPR-compliant Privacy Policy
3. Set `PAYSTACK_SECRET_KEY` on Render (live payments)
4. Enable HTTPS on your Render domain (automatic)
5. Complete 2FA setup for founder account

---

## 8. Remaining Blockers

### Before Play Store Submission
- [ ] Privacy Policy page hosted at a public URL
- [ ] `PAYSTACK_SECRET_KEY` set in Render (live payments must work in app review)
- [ ] Production APK signed with release keystore
- [ ] App icon 512x512 PNG
- [ ] Store screenshots (phone + 7" tablet)

### Before App Store Submission
- [ ] Privacy Policy page hosted at a public URL
- [ ] Apple Developer account ($99/year) active
- [ ] iOS app signed with Distribution certificate
- [ ] App Store screenshots (6.5" + 5.5" + iPad if applicable)
- [ ] Privacy Manifest file if using sensitive APIs

### Before Both
- [ ] Set `SESSION_SECRET` in Render environment
- [ ] Set `DATABASE_URL` in Render (if not already set)
- [ ] Set `PAYSTACK_SECRET_KEY` + `PAYSTACK_PUBLIC_KEY` in Render
- [ ] Enable founder 2FA after first login
- [ ] Test end-to-end: register → subscribe → payout flow on production URL

---

## 9. Security Summary

| Check | Status |
|-------|--------|
| Admin portal isolated from user app | ✅ |
| Admin links removed from user navigation | ✅ |
| Admin sessions separate from user sessions | ✅ |
| Founder bootstrap one-time only | ✅ |
| Password hashed with scrypt + salt | ✅ |
| Login rate limiting (10/15min per IP) | ✅ |
| TOTP 2FA available | ✅ |
| Recovery codes (8 single-use) | ✅ |
| Session secret from environment | ✅ (requires `SESSION_SECRET` in Render) |
| Paystack webhook signature verification | ✅ |
| Audit logging for all admin actions | ✅ |
| Admin routes use correct middleware | ✅ |
