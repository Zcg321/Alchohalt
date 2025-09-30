# Alchohalt Repository Review and Road-to-Release Plan

## Current Status

### Repository Structure
Alchohalt is a React/TypeScript progressive web application built with Vite and Capacitor. The default branch (`main`) contains the web app and native platform projects (`android/` and `ios/`). Data is stored only on the device using Capacitor Preferences; there is no server or account system.

### Core Features
The app offers:
- **Drink Logging**: Track drinks with "HALT" (Hunger-Anger-Loneliness-Tiredness) flags
- **Craving Tracking**: Rate and monitor cravings over time
- **Intentions & Alternatives**: Log intentions and alternative actions
- **Cost Tracking**: Monitor spending with budgets and variance tracking
- **Goal Setting**: Set daily caps and weekly consumption totals
- **Streaks & Achievements**: Track alcohol-free streaks and milestones
- **Statistics & Insights**: 30-day averages, HALT trigger counts, longest AF streaks
- **Spending Dashboard**: Budget vs. actual spend with variance bar, estimated savings, top cost days with donut chart
- **Local Notifications**: Optional daily check-in reminders (device-based)
- **Multi-language Support**: English and Spanish with device-persisted preferences
- **Dark Theme**: Toggleable light/dark mode with device persistence
- **Offline Support**: PWA with Workbox-powered offline caching
- **Data Management**: Export/Import JSON with SHA-256 checksumming, wipe all data option

### README Documentation
The `README.md` describes an "experimental React app … store on device only" with no medical advice and provides a release checklist. The app is explicitly privacy-focused with 100% on-device storage via Capacitor Preferences (`alchohalt.db`).

### Subscription System (Not Implemented)
Subscription plans (`Free`, `Essential`, `Premium`) and UI for managing them are defined in `SubscriptionManager.tsx`. The subscription store uses Zustand with persisted state but **does not integrate any real payment system**. Premium data export UI exists but uses **stub functions**; PDF/CSV export is **not yet implemented**. Multi-device sync is marked **"coming soon"**.

### Privacy Policy
The privacy policy placeholder states all data is kept on device and that future online features will be opt-in.

## Tests and Tooling

### Automated Checks
The repository includes:
- **Unit Tests**: Vitest-based test suite with coverage tracking (currently 54.55%)
- **Release Checklist Script**: `scripts/release-checklist.sh` that runs:
  - TypeScript type checking (`npm run typecheck`)
  - ESLint linting (`npm run lint`)
  - Test suite (`npm test`)
  - Production build (`npm run build`)
  - PWA asset validation (manifest.webmanifest, sw.js)
  - Capacitor platform sync (`npx cap sync`)
  - Bundle size checks (`npm run size:report`)
  - Dependency security audit (`npm audit --audit-level moderate`)
  - Data integrity tests (manual verification required)

### CI/CD Status
**Note**: There is currently **no CI pipeline or automated deployment** configured.

### Manual Release Tasks
The release script identifies manual verification requirements:
- Test data export → wipe → import flow
- Verify notifications on physical device (Android/iOS)
- Check app store compliance and metadata
- Validate screenshots and metadata
- Build native apps: `npm run build:android` && `npm run build:ios`
- Tag release: `git tag -a v1.0.0 -m 'Release v1.0.0'`
- Push tag: `git push origin v1.0.0`
- Upload to app stores with staged rollout

## Native Projects

### Android
The Android project is set up with Capacitor. `build.gradle` defines:
- `applicationId`: `com.alchohalt.app`
- Standard Capacitor dependencies for Android

### iOS
The iOS project is configured with Capacitor for iOS platform support.

### Google Services
The `google-services.json` file configuration (if present) should be reviewed for any cloud service integrations that may conflict with the privacy-first, on-device-only approach.

## Release Blockers and Considerations

### 1. Subscription/Payment System
- **Status**: UI exists but no payment integration
- **Impact**: If subscription features are shown to users, they will be non-functional
- **Recommendation**: Either remove/hide subscription UI or implement real payment system before release

### 2. Premium Features
- **Status**: PDF/CSV export marked as premium but not implemented
- **Impact**: Users expecting premium features will be disappointed
- **Recommendation**: Implement or clearly mark as "coming soon"

### 3. Multi-Device Sync
- **Status**: Marked as "coming soon"
- **Impact**: May create user expectations that cannot be met
- **Recommendation**: Ensure messaging is clear that this is a future feature

### 4. CI/CD Pipeline
- **Status**: Not configured
- **Impact**: Manual testing required, risk of inconsistent builds
- **Recommendation**: Set up GitHub Actions for automated testing and builds

### 5. App Store Readiness
- **Status**: Screenshots are placeholders
- **Impact**: Cannot submit to stores without actual screenshots
- **Recommendation**: Create actual screenshots from the app on various devices

### 6. Privacy/Legal Documentation
- **Status**: Placeholder content with email `privacy@alchohalt.com`
- **Impact**: May not meet app store legal requirements
- **Recommendation**: Finalize privacy policy, terms of service with real contact information

### 7. Google Services Configuration
- **Status**: Needs review
- **Impact**: May conflict with privacy-first approach
- **Recommendation**: Audit for any cloud/analytics services that violate on-device principle

## Pre-Release Checklist

### Code Quality
- [x] TypeScript type checking passes
- [x] ESLint linting passes
- [x] Test suite passes (54.55% coverage, target met)
- [x] Production build succeeds
- [x] PWA assets generated correctly

### Functionality Testing
- [ ] Manual test: Export data to JSON
- [ ] Manual test: Wipe all data
- [ ] Manual test: Import data from JSON
- [ ] Manual test: Verify checksum validation
- [ ] Manual test: Local notifications on Android physical device
- [ ] Manual test: Local notifications on iOS physical device
- [ ] Manual test: Offline functionality (airplane mode)
- [ ] Manual test: PWA installation on mobile
- [ ] Manual test: PWA installation on desktop

### App Store Requirements
- [ ] Create actual screenshots (replace placeholders)
- [ ] Finalize app store descriptions
- [ ] Finalize privacy policy with real contact information
- [ ] Finalize terms of service
- [ ] Review and remove/disable stub subscription features
- [ ] Test on minimum supported Android version
- [ ] Test on minimum supported iOS version
- [ ] Verify app store compliance (content ratings, etc.)

### Performance & Size
- [ ] Bundle size within acceptable limits
- [ ] Lighthouse PWA score ≥95
- [ ] APK/IPA size reasonable for download

### Security
- [ ] Dependency audit passes with no critical/high vulnerabilities
- [ ] No hardcoded secrets or credentials
- [ ] Review Google Services configuration for privacy compliance

## Recommended Release Path

### Phase 1: Core Functionality Release (MVP)
Focus on the working, tested features:
1. Remove or clearly disable subscription/premium features
2. Finalize legal documentation
3. Create actual screenshots
4. Complete manual testing checklist
5. Set up basic CI/CD for automated testing
6. Release as v1.0.0 with clear "on-device only" messaging

### Phase 2: Enhanced Features (Future)
After successful v1.0.0 release:
1. Implement real payment system for subscriptions
2. Implement premium features (PDF/CSV export)
3. Add multi-device sync (with clear privacy disclosures)
4. Expand CI/CD for automated deployments

## Next Steps

1. **Decision Required**: Determine if subscription features should be included in v1.0.0 or deferred
2. **Update Documentation**: Finalize privacy policy and terms with real contact information
3. **Create Assets**: Generate actual screenshots from the app
4. **Testing**: Complete all manual verification tasks
5. **CI/CD**: Set up GitHub Actions workflow for automated testing
6. **Release**: Follow the release-checklist.sh script and tag v1.0.0

## Available Scripts

- `npm run verify:release` - Quick pre-release verification (typecheck + test + build)
- `npm run release:checklist` - Full release checklist with all validations
- `npm run build:android` - Build Android APK
- `npm run build:ios` - Build iOS archive
- `npm run lh` - Lighthouse PWA audit instructions (manual)
- `npm run preview` - Preview production build locally

## Contact

For questions about this release plan, contact the repository maintainer.
