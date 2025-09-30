# Manual Testing Checklist for v1.0.0 Release

This checklist covers manual testing tasks that cannot be automated. Complete these before tagging v1.0.0.

## 🧪 Functionality Testing

### Data Management
- [ ] **Export Data**
  1. Add several drink entries with various details (HALT flags, costs, etc.)
  2. Go to Settings → Export Data
  3. Verify JSON file is downloaded with correct structure
  4. Verify file includes SHA-256 checksum
  5. Verify file includes version number

- [ ] **Import Data**
  1. Use the exported JSON file from above
  2. Go to Settings → Import Data
  3. Select the JSON file
  4. Verify checksum is validated
  5. Verify all data is imported correctly
  6. Check that entries, goals, and settings are restored

- [ ] **Wipe Data**
  1. Go to Settings → Clear All Data
  2. Verify double confirmation dialog appears
  3. Confirm deletion
  4. Verify all data is cleared
  5. Verify app returns to initial state

- [ ] **Checksum Validation**
  1. Export data to get a valid JSON file
  2. Manually edit the JSON file (change a value)
  3. Attempt to import the modified file
  4. Verify checksum validation fails with clear error message

### Core Features

- [ ] **Drink Logging**
  1. Add a new drink entry
  2. Include HALT flags, craving rating, cost
  3. Verify entry appears in history
  4. Edit the entry
  5. Verify changes are saved
  6. Delete the entry
  7. Verify undo prompt appears
  8. Test undo functionality

- [ ] **Goals**
  1. Set a daily cap goal
  2. Set a weekly total goal
  3. Add drink entries to test against goals
  4. Verify progress bars update correctly
  5. Verify visual indicators for exceeding goals

- [ ] **Statistics**
  1. Add multiple entries over several days
  2. View Stats page
  3. Verify 30-day average craving score
  4. Verify HALT trigger counts
  5. Verify longest AF streak is accurate
  6. Verify current streak badge displays correctly

- [ ] **Spending Dashboard**
  1. Set a budget in settings
  2. Add drinks with costs
  3. View spending dashboard
  4. Verify budget vs. actual comparison
  5. Verify savings calculation for AF days
  6. Verify top cost days list
  7. Verify donut chart displays correctly

### User Interface

- [ ] **Dark Mode**
  1. Toggle dark mode in Settings
  2. Verify theme persists after app reload
  3. Check all pages render correctly in dark mode
  4. Check contrast and readability

- [ ] **Language Support**
  1. Switch to Spanish in Settings
  2. Verify UI text changes to Spanish
  3. Verify language persists after reload
  4. Switch back to English
  5. Verify all translations are present (no missing keys)

- [ ] **Offline Mode**
  1. Use the app normally
  2. Enable airplane mode or disconnect network
  3. Navigate through all pages
  4. Add/edit/delete entries
  5. Verify all features work offline
  6. Reconnect network
  7. Verify app continues to work normally

## 📱 Device Testing

### Android Physical Device

- [ ] **Installation**
  1. Build APK: `npm run build:android`
  2. Install on physical Android device
  3. Verify app icon displays correctly
  4. Verify app opens without crashes

- [ ] **Local Notifications**
  1. Go to Settings → Reminders
  2. Enable daily check-in reminder
  3. Set a reminder time (e.g., 2 minutes from now)
  4. Wait for notification
  5. Verify notification appears
  6. Tap notification
  7. Verify app opens to correct screen

- [ ] **PWA Installation (Android)**
  1. Open app in Chrome on Android
  2. Look for "Add to Home Screen" prompt
  3. Install PWA
  4. Verify icon on home screen
  5. Open from home screen
  6. Verify app runs in standalone mode (no browser UI)

- [ ] **Performance**
  1. Test on older Android device (if available)
  2. Verify smooth scrolling
  3. Verify reasonable load times
  4. Check for memory leaks (extended usage)

### iOS Physical Device

- [ ] **Installation**
  1. Build IPA: `npm run build:ios`
  2. Install on physical iOS device via TestFlight or direct install
  3. Verify app icon displays correctly
  4. Verify app opens without crashes

- [ ] **Local Notifications**
  1. Go to Settings → Reminders
  2. Enable daily check-in reminder
  3. Set a reminder time
  4. Wait for notification
  5. Verify notification appears
  6. Tap notification
  7. Verify app opens to correct screen

- [ ] **PWA Installation (iOS)**
  1. Open app in Safari on iOS
  2. Tap Share button → Add to Home Screen
  3. Install PWA
  4. Verify icon on home screen
  5. Open from home screen
  6. Verify splash screen displays
  7. Verify app runs in standalone mode

- [ ] **Performance**
  1. Test on older iOS device (if available)
  2. Verify smooth scrolling
  3. Verify reasonable load times
  4. Check for memory leaks (extended usage)

## 🎨 App Store Readiness

### Screenshots

- [ ] **Mobile Screenshots (required)**
  1. Take screenshots on Android device:
     - Home/Dashboard screen
     - Drink logging screen
     - Statistics screen
     - Settings screen
     - (5-8 screenshots recommended)
  2. Take screenshots on iOS device:
     - Same screens as Android
  3. Save in `public/screenshots/mobile/`
  4. Remove or replace placeholder files

- [ ] **Desktop Screenshots (optional)**
  1. Take screenshots in desktop browser
  2. Show responsive design
  3. Save in `public/screenshots/desktop/`

### Metadata

- [ ] **App Description**
  1. Draft app store description (< 80 chars short, < 4000 chars full)
  2. Highlight privacy-first approach
  3. List key features
  4. Include disclaimer about not being medical advice

- [ ] **App Store Compliance**
  1. Verify content rating is appropriate (likely 12+/Teen due to alcohol content)
  2. Confirm privacy policy meets store requirements
  3. Confirm terms of service meets store requirements
  4. Check for any health-related disclaimers required by stores

## ⚡ Performance

### Lighthouse PWA Audit

- [ ] **Run Audit**
  1. Build production version: `npm run build`
  2. Preview: `npm run preview`
  3. Open Chrome DevTools
  4. Run Lighthouse audit in PWA mode
  5. Target score: ≥95 for PWA category

- [ ] **Lighthouse Checklist**
  - [ ] PWA score ≥95
  - [ ] Performance score ≥90
  - [ ] Accessibility score ≥90
  - [ ] Best Practices score ≥90
  - [ ] SEO score ≥90

- [ ] **PWA Criteria**
  - [ ] Installable
  - [ ] Service worker registered
  - [ ] Offline functionality
  - [ ] Fast load times
  - [ ] Viewport meta tag
  - [ ] HTTPS (when deployed)

### Bundle Size

- [ ] **Check Bundle Size**
  1. Run: `npm run size:report`
  2. Verify main bundle is within acceptable limits
  3. Check for any unexpectedly large dependencies
  4. Verify code splitting is working

- [ ] **APK/IPA Size**
  1. Check Android APK size (target < 50MB)
  2. Check iOS IPA size (target < 50MB)
  3. If too large, identify and optimize large assets

## 🔒 Security

### Dependency Audit

- [ ] **Run Audit**
  1. Run: `npm audit`
  2. Review all moderate/high/critical vulnerabilities
  3. Update or patch vulnerable dependencies
  4. Document any accepted risks

### Code Review

- [ ] **Secrets Check**
  1. Search codebase for hardcoded API keys
  2. Search for hardcoded passwords
  3. Search for private keys
  4. Verify no sensitive data in git history

- [ ] **Google Services Review**
  1. Check if `google-services.json` exists
  2. If present, verify it doesn't enable analytics/crashlytics
  3. Ensure no cloud services conflict with privacy-first approach
  4. Document any Google services used and their purpose

### Privacy Compliance

- [ ] **Data Storage Verification**
  1. Verify all data is stored using Capacitor Preferences
  2. Verify no data is sent to external servers
  3. Check network tab in DevTools - should see no outgoing requests with user data
  4. Verify export/import uses only local file system

## ✅ Final Checks

- [ ] All functionality tests passed
- [ ] Tested on at least one Android physical device
- [ ] Tested on at least one iOS physical device
- [ ] Screenshots created and saved
- [ ] Lighthouse PWA score ≥95
- [ ] No critical security vulnerabilities
- [ ] Privacy policy and terms finalized
- [ ] App store metadata prepared
- [ ] Release notes written

## 📝 Sign-Off

Once all items are checked, you're ready to:

1. Run: `npm run release:checklist`
2. Tag: `git tag -a v1.0.0 -m 'Release v1.0.0'`
3. Push: `git push origin v1.0.0`
4. Build native apps for store submission

---

**Tester Name:** ___________________  
**Date:** ___________________  
**Signature:** ___________________
