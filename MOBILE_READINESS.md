# STINE Mobile Store Readiness Checklist

_Generated: June 2026 · Platform: STINE DJ Live-Streaming_

---

## Overview

This document tracks the requirements for publishing STINE on the Apple App Store and Google Play Store. It covers technical, legal, design, and operational requirements.

---

## 1. App Store Requirements (iOS / Apple)

### Identity & Metadata
- [ ] **App Name**: "STINE" (15 chars max for iOS) — confirm uniqueness
- [ ] **Bundle ID**: `com.stine.app` (reverse-DNS, registered in App Store Connect)
- [ ] **SKU**: Unique identifier set in App Store Connect
- [ ] **Category**: Music → Live Audio Streaming
- [ ] **Sub-category**: Entertainment
- [ ] **Age Rating**: 12+ (due to user-generated content, in-app purchases)
- [ ] **Copyright**: © 2026 STINE / Beyin365

### Screenshots & Assets
- [ ] App icon: 1024×1024px PNG, no alpha, no rounded corners
- [ ] iPhone 6.5" screenshots (1242×2688px) — min 3, max 10
- [ ] iPhone 5.5" screenshots (1242×2208px)
- [ ] iPad 12.9" screenshots (2048×2732px) — if iPad supported
- [ ] App preview video: 15–30 seconds, H.264, 30fps (optional but recommended)
- [ ] Feature graphic for search (if applicable)

### Legal & Compliance
- [ ] **Privacy Policy URL**: Publicly accessible (e.g. stine.app/privacy)
- [ ] **Terms of Service URL**: stine.app/terms ✅ (page exists in app)
- [ ] **Support URL**: stine.app/support or email
- [ ] **EULA**: Apple's standard or custom EULA
- [ ] **COPPA compliance**: Users under 13 handled (if any)
- [ ] **Content moderation policy**: Document how user-generated audio/chat is moderated
- [ ] **Music licensing**: Confirm DJs have rights to broadcast content (T&C clause required)

### In-App Purchases (IAP)
- [ ] Subscription tiers configured in App Store Connect:
  - Free (₦0)
  - Basic (₦5,000/month → ~$3.50 USD equivalent)
  - Pro (₦15,000/month)
  - Premium (₦50,000/month)
- [ ] RevenueCat or native StoreKit integration reviewed
- [ ] Restore purchases button present in UI
- [ ] Subscription management deep link: `itms-apps://apps.apple.com/account/subscriptions`
- [ ] **Note**: Apple takes 30% of IAP revenue (15% for small developers). Nigerian Naira IAP requires Tier mapping.

### Technical (iOS)
- [ ] Minimum iOS version: iOS 15+ recommended
- [ ] Background audio entitlement: Required for live stream listening while app is backgrounded
- [ ] Microphone permission string (NSMicrophoneUsageDescription) for DJ streaming
- [ ] Push notification entitlement (for live stream alerts)
- [ ] Network security exceptions reviewed (ATS compliance)
- [ ] App compiles without warnings on Xcode 15+
- [ ] No private API usage
- [ ] Sign in with Apple required if any social login is offered
- [ ] TestFlight beta distributed before public submission
- [ ] Crash-free rate ≥ 99.5% (Apple monitors this post-launch)

---

## 2. Google Play Store Requirements (Android)

### Identity & Metadata
- [ ] **Package name**: `com.stine.app` (must match signing key)
- [ ] **App name**: STINE (50 chars max)
- [ ] **Short description**: 80 chars max
- [ ] **Full description**: 4000 chars max
- [ ] **Category**: Music & Audio
- [ ] **Content rating**: Complete IARC questionnaire → expected PEGI 12 / Everyone 10+
- [ ] **Target audience**: 13+ (due to financial transactions)

### Graphics & Assets
- [ ] Hi-res icon: 512×512px PNG (no alpha)
- [ ] Feature graphic: 1024×500px (shown in Play Store listing)
- [ ] Phone screenshots: min 2, max 8 (320–3840px, 16:9 or 9:16)
- [ ] Tablet screenshots: min 1 (7" and/or 10")
- [ ] Promo video: YouTube link (optional)

### Legal & Compliance
- [ ] Privacy Policy URL (required for all apps)
- [ ] Data Safety section in Play Console: declare what data is collected:
  - Email address (required, shared with platform)
  - Audio content (uploaded/streamed by user)
  - Payment info (handled via Paystack — third party)
  - Usage data (analytics)
- [ ] Financial declaration: App facilitates payments → must declare
- [ ] **Nigeria-specific**: Google Play supports NGN billing
- [ ] No cryptocurrency/NFT claims unless compliant with Play policy (current "NFT access" tier feature needs review)

### In-App Purchases (Billing)
- [ ] Google Play Billing Library 6.x integrated
- [ ] Subscription products created in Play Console matching Paystack tiers
- [ ] Graceful handling when billing unavailable
- [ ] Paystack used for web — Play Billing required for Android IAP per Play policy
  - **Action required**: Either use Play Billing for Android subscriptions OR use web-only checkout (redirect to browser)

### Technical (Android)
- [ ] Target SDK: API 34 (Android 14) as of 2024 requirement
- [ ] Minimum SDK: API 26 (Android 8.0) recommended
- [ ] App Bundle format (AAB, not APK) required for new apps
- [ ] 64-bit support required
- [ ] Network Security Config (no cleartext traffic)
- [ ] ProGuard/R8 obfuscation for release builds
- [ ] Background audio: Foreground service with `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
- [ ] RECORD_AUDIO permission with rationale for DJ mode
- [ ] INTERNET permission declared
- [ ] All dependencies checked for Play policy violations
- [ ] Signed with upload keystore (keep keystore SAFE — loss = inability to update)

---

## 3. Cross-Platform Requirements

### Expo / React Native Readiness
- [ ] Expo SDK version is up to date (50+)
- [ ] OTA updates strategy (EAS Update) — confirm allowed on both stores
- [ ] EAS Build configured for iOS and Android
- [ ] App config (`app.json`/`app.config.js`) complete with all fields
- [ ] Splash screen designed and integrated
- [ ] App icon all sizes generated
- [ ] Deep linking scheme configured (`stine://`)
- [ ] Universal links (iOS) / App links (Android) for web ↔ app handoff

### Performance Benchmarks (Before Submission)
- [ ] Cold start time < 3 seconds on mid-range device
- [ ] Audio latency < 500ms for live stream connection
- [ ] Memory usage < 200MB under normal usage
- [ ] App size < 50MB (after AAB optimization)
- [ ] 60fps UI on iPhone 11 / Pixel 4a or better

---

## 4. Pre-Submission Checklist

### Security
- [ ] No hardcoded secrets or API keys in client-side code
- [ ] Certificate pinning for API requests (production)
- [ ] Jailbreak/root detection (optional but recommended for payment features)
- [ ] Obfuscation enabled for release builds

### Testing
- [ ] Tested on physical devices (not just emulators): iPhone 12, Samsung Galaxy A52
- [ ] Offline mode gracefully handled (no crashes)
- [ ] All IAP flows tested in sandbox mode
- [ ] Push notifications tested end-to-end
- [ ] Accessibility: VoiceOver (iOS) and TalkBack (Android) tested for core flows
- [ ] Tested on slow network (3G simulation)

### Accounts Required
- [ ] Apple Developer Account: $99/year — enroll at developer.apple.com
- [ ] Google Play Developer Account: $25 one-time — play.google.com/console
- [ ] Google Play Merchant Account: Required for paid apps/IAP

---

## 5. Nigerian Market Considerations

- [ ] Paystack is confirmed working in Nigeria — primary payment rail ✅
- [ ] Currency display: Nigerian Naira (₦ / NGN) ✅
- [ ] Low-data mode: Consider adaptive bitrate for poor network conditions
- [ ] SMS OTP: Consider for account verification (many Nigerians use phone-first)
- [ ] Offline playback: High priority for intermittent connectivity
- [ ] Network provider: Test on MTN, Airtel, Glo, 9mobile connections
- [ ] WhatsApp share: Social sharing integration for viral growth
- [ ] USSD fallback: Long-term consideration for payments without internet

---

## 6. Post-Launch Monitoring

- [ ] Crash reporting: Sentry or Firebase Crashlytics
- [ ] Analytics: Firebase Analytics or Amplitude
- [ ] App Store / Play Store review monitoring
- [ ] Paystack webhook reliability monitoring
- [ ] Customer support channel (email, WhatsApp Business)

---

## Priority Order for Store Submission

1. **Immediate** (blocking): Privacy Policy page, Apple Developer Account, Play Console Account
2. **Short-term** (before submission): Background audio, Push notifications, IAP integration review
3. **Medium-term** (v1.1): Deep linking, OTA updates, performance benchmarks
4. **Long-term** (v2.0): Offline playback, USSD, SMS OTP

---

_This checklist should be reviewed and signed off by the technical lead and legal counsel before store submission._
