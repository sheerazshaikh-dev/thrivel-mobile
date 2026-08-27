# Thrivel ID Mobile — Production Candidate 3.1.0

Expo / React Native member app for iOS and Android, ported from the current Thrivel web frontend.

## API configuration

Only one environment variable is required:

```env
VITE_API_BASE_URL=https://thrivel-iq.brandandbrains.com
```

Branding and media are loaded from `GET /settings` first, including logos, hero/auth/assessment/checkout/dashboard artwork, default product image and brand colors. Product images come from the catalog API. Bundled images are fallback assets only.

## Included parity work

- Authenticated `/` behavior: logged-in customers are sent to Dashboard.
- Persistent native auth token in Expo SecureStore.
- Dashboard navigation with native tabs and floating AI Health Coach entry.
- ChatGPT-style Assessment and AI Health Coach UX.
- Assessment product matching through `/recommendations/match`.
- Optional private body-profile upload: front + side required, back optional, consent, API upload and analysis.
- Recommendation logic that excludes already purchased products and service products.
- Checkout/account creation flow against the existing PHP API.
- Dashboard progress tracking, weight logs, weekly check-ins, nutrition logs and reviewer responses.
- Current Plan with workout, meal, weekly targets, products/support, reviewer notes and meal regeneration.
- Product + AI Health Coach subscription management.
- Orders and profile flows.
- Profile body-profile deletion and password change.
- Network timeouts and 401 token invalidation.
- Dynamic API branding/assets with local fallbacks.

## Install

```powershell
cd C:\Sheeraz\Custom\thrivel-mobile
Copy-Item .env.example .env
npm install
npx expo install --fix
npx expo-doctor
```

Do not run `npm audit fix --force` on an Expo project. It can move React/native packages outside the SDK-compatible versions.

## Test on a physical phone

```powershell
npx expo start --clear
```

For iPhone/remote network testing:

```powershell
npx expo start --tunnel
```

## APK

```powershell
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Store builds

```powershell
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Release gate

The frontend is configured for store builds, but production launch still depends on the backend payment provider. If the API returns `paymentProvider: "prototype"`, recurring billing is not production-ready and must be replaced server-side before public launch.


## Assessment hotfix (2026-08-28)
- Fixed a duplicate StyleSheet key that could prevent the assessment route from bundling.
- Take Assessment now always starts at the email gate, matching the web flow instead of reopening stale/completed assessment state.
- Starting an assessment clears prior guest assessment/recommendation selections before saving the new email.
- Fixed numeric questions to store numbers and enforce configured min/max ranges.
- Slider questions now default to the midpoint like the web version.
- Fixed the optional body-profile upload lock that could leave the assessment unable to advance.
- Added a synchronous submission guard to prevent double taps from skipping/corrupting question state.

## 3.1.0 branding/navigation update
- Renamed visible product branding from Thrivel IQ to Thrivel ID.
- Updated iOS/Android app identifiers to com.brandandbrains.thrivelid.
- Replaced the default app icon and adaptive icon with the supplied Thrivel ID mark.
- Startup preloader/splash uses the brand accent background (#F4946E by default; runtime preloader uses API accentColor).
- AI Health Coach now has an explicit Back control on loading, error, entitlement, empty-chat, and active-chat states.
- Hidden Subscriptions screen also has an explicit Back-to-Dashboard control.
