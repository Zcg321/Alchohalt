# Pre-Release Checklist for Alchohalt

This document tracks the hardening and preparation tasks completed and remaining for the v1.0 MVP release.

## ✅ Completed Tasks

### Code Quality & Stability
- [x] Fixed TypeScript compilation errors (data-export.ts type assertion)
- [x] All linting checks pass (30 warnings about function length - non-blocking)
- [x] All unit tests pass (54.55% coverage, meets 50% target)
- [x] Production build succeeds without errors

### Platform Readiness
- [x] Added Android 13+ notification permission (`POST_NOTIFICATIONS`) to AndroidManifest.xml
- [x] Verified iOS notification support (handled by Capacitor LocalNotifications plugin)

### UI/UX Polish
- [x] Hidden all "Upgrade to Premium" UI when subscriptions are disabled (ENABLE_SUBSCRIPTIONS=false)
  - PersonalizedDashboard.tsx
  - PremiumMoodTracking.tsx
  - PremiumDataExport.tsx
  - DrinkDiscovery.tsx
  - SocialChallenges.tsx
  - EnhancedMoodTracker.tsx
  - AchievementDisplay.tsx
- [x] Updated placeholder email addresses with GitHub Issues/Discussions links
- [x] Added TODO comments marking where real contact info is needed

### Feature Flags
- [x] Subscriptions disabled by default (ENABLE_SUBSCRIPTIONS=false)
- [x] Premium features disabled by default (ENABLE_PREMIUM_FEATURES=false)
- [x] Multi-device sync marked as not implemented (ENABLE_MULTI_DEVICE_SYNC=false)
- [x] PDF/CSV export marked as not implemented (ENABLE_PDF_CSV_EXPORT=false)
- [x] Enhanced features (Health, Voice, AI, etc.) disabled by default

## 📋 Remaining Tasks Before First Device Test

### High Priority (Required for Device Testing)

#### 1. Build Mobile Apps
```bash
# Android
npm run build:android
# Output: android/app/build/outputs/apk/release/app-release.apk

# iOS
npm run build:ios
# Then open ios/App/App.xcworkspace in Xcode
```

#### 2. Physical Device Testing
- [ ] Install APK on Android device (enable USB debugging or sideloading)
- [ ] Deploy to iOS device (requires Apple Developer provisioning profile)
- [ ] Test local notifications on both platforms
  - Enable reminder in Settings
  - Wait for notification to appear at scheduled time
  - Verify notification permission prompt appears
- [ ] Test data export/import flow
  - Create sample log entries
  - Export to JSON
  - Wipe all data
  - Import JSON back
  - Verify checksum validation passes
- [ ] Test offline functionality
  - Enable airplane mode
  - Open app and verify it loads
  - Create entries while offline
  - Verify no crashes or errors
- [ ] Test PWA installation
  - Visit app in mobile browser
  - Use "Install" prompt or PWAInstallBanner
  - Verify installed app works offline
- [ ] Test language switching (English ↔ Spanish)
  - Toggle language in Settings
  - Verify UI text updates
  - Check for missing translations
- [ ] Test edge cases
  - Edit and delete entries
  - Undo deletion
  - Add preset drinks
  - Exceed daily/weekly goals
  - View statistics and charts

### Medium Priority (Before Public Release)

#### 3. Contact Information
- [ ] Set up real support email or contact form
- [ ] Update TODOs in:
  - `src/features/settings/About.tsx` (line 58)
  - `src/features/legal/PrivacyPolicy.tsx` (line 108)
  - `src/features/legal/TermsOfService.tsx` (line 130)
- [ ] Create privacy policy URL for app store submission (can use GitHub Pages)

#### 4. App Store Assets
- [ ] Create real app icon (if current is placeholder)
- [ ] Take actual screenshots for multiple device sizes
  - Replace placeholders in `public/screenshots/`
- [ ] Write app description for stores
- [ ] Prepare app store keywords
- [ ] Set appropriate age rating (likely 17+ due to alcohol tracking)

#### 5. Legal & Compliance
- [ ] Review and finalize Privacy Policy content
- [ ] Review and finalize Terms of Service content
- [ ] Ensure medical disclaimer is prominent
- [ ] Verify no external data transmission (maintain privacy stance)
- [ ] Prepare privacy labels for App Store submission

#### 6. Security & Dependencies
- [ ] Run `npm audit` and fix any high/critical vulnerabilities
- [ ] Run `npm outdated` and plan dependency updates
- [ ] Verify no hardcoded secrets or API keys in code
- [ ] Confirm google-services.json is absent (or contains no unwanted config)

### Low Priority (Post-MVP Improvements)

#### 7. Code Quality Enhancements
- [ ] Address function length warnings (30 files exceed 80 lines)
- [ ] Increase test coverage toward 70% goal
- [ ] Run dead code analysis: `npm run deadcode`
- [ ] Check unused dependencies: `npm run deps:check`
- [ ] Run full health scan: `npm run health:scan`

#### 8. CI/CD Setup
- [ ] Create GitHub Actions workflow for automated testing
- [ ] Add workflow for linting on each PR
- [ ] Set up automated mobile builds (optional)
- [ ] Enable branch protection rules

#### 9. Performance Optimization
- [ ] Run Lighthouse PWA audit (target score ≥95)
- [ ] Run bundle size check: `npm run size:report`
- [ ] Test with large datasets (many months of logs)
- [ ] Consider migration to structured DB if performance degrades

#### 10. Optional Enhanced Features
If you want to test these, enable the feature flags and follow setup:
- [ ] Health app integration (Apple HealthKit / Google Fit)
  - Install optional dependencies
  - Add platform-specific permissions
  - Configure API credentials
- [ ] Voice logging (Speech Recognition)
  - Add microphone permissions to iOS Info.plist
  - Test speech-to-text functionality
- [ ] Other enhanced features (AI, Journaling, etc.)

## 🚀 Release Process

### Before Public Launch
1. Run full release checklist: `npm run release:checklist`
2. Tag release version: `git tag v1.0.0`
3. Generate release notes
4. Prepare TestFlight build (iOS) or Play Store internal testing (Android)
5. Invite beta testers
6. Collect and address feedback

### Subscription Implementation (Future)
When ready to enable subscriptions:
1. Integrate payment SDKs (App Store / Google Play billing)
2. Implement premium feature logic (PDF export, advanced analytics, etc.)
3. Set up subscription management and cancellation flows
4. Test purchase flows on both platforms
5. Update privacy policy to mention payment processing
6. Set `ENABLE_SUBSCRIPTIONS=true` in environment

### Multi-Device Sync (Future)
When implementing cloud sync:
1. Choose backend solution (Firebase, custom API, etc.)
2. Implement end-to-end encryption for data
3. Add sync conflict resolution logic
4. Update privacy policy to mention cloud storage
5. Test sync across multiple devices
6. Set `ENABLE_MULTI_DEVICE_SYNC=true` in environment

## 📝 Notes

### Current State
- App is in MVP state with all core features functional
- All data is local-only (no cloud backend)
- Subscription UI is hidden (no payment integration)
- Premium features are unavailable (marked as "coming soon")
- Enhanced features (Health, Voice, AI) are disabled

### Privacy Commitment
- All user data stays on device
- No external network calls
- No analytics sent to servers (local-only logging)
- No third-party tracking
- Maintain this stance even when adding future features

### Development Commands
```bash
# Quality checks
npm run lint          # Code linting
npm run typecheck     # TypeScript validation
npm test              # Run test suite
npm run build         # Production build

# Health & analysis
npm run health:scan   # Comprehensive health check
npm run deadcode      # Find unused code
npm run deps:check    # Check dependencies
npm run size:report   # Bundle size analysis

# Mobile builds
npm run build:android # Build Android APK
npm run build:ios     # Build iOS archive
```

## ✨ Success Criteria for v1.0 MVP

- [x] All core features working (logging, goals, stats, notifications)
- [x] No TypeScript errors
- [x] All tests passing
- [x] Production build succeeds
- [x] Subscription UI properly hidden
- [ ] Successfully tested on physical Android device
- [ ] Successfully tested on physical iOS device
- [ ] Offline functionality verified
- [ ] Data export/import flow tested
- [ ] No crashes during normal usage
- [ ] Privacy policy and terms finalized
- [ ] Contact information updated

**Current Status**: Ready for device testing. Complete remaining high-priority tasks before public release.
