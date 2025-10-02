# First Device Test Guide

This guide provides step-by-step instructions for building and installing Alchohalt on physical devices for the first time.

## Prerequisites

- Node.js v20.x (LTS) - Currently using v20.19.5
- npm v10.x - Currently using v10.8.2
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)
- Physical device or emulator

## Environment Setup

### 1. Install Dependencies

```bash
npm ci
```

### 2. Sync Capacitor

```bash
npx cap sync
```

This command:
- Copies web assets to native projects
- Updates native dependencies
- Syncs plugin configurations

## Android Build & Install

### Quick Commands

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build from command line (requires Android SDK setup)
cd android
./gradlew assembleRelease
cd ..

# Install APK to connected device
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Configuration

- **Package ID**: `com.alchohalt.app`
- **Min SDK**: 24 (Android 7.0+)
- **Target SDK**: 34 (Android 14)
- **Version**: 1.0.0 (versionCode 1)

### Required Permissions

- `android.permission.INTERNET` - For PWA functionality
- `android.permission.POST_NOTIFICATIONS` - For local reminders (Android 13+)

### Build APK Size Budget

- Target: < 30 MB
- Current estimate: ~10-15 MB (unoptimized)

## iOS Build & Install

### Quick Commands

```bash
# Build web assets
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Build and install from Xcode:
# 1. Select your device/simulator
# 2. Product > Build (⌘B)
# 3. Product > Run (⌘R)
```

### Configuration

- **Bundle ID**: `com.alchohalt.app`
- **Version**: 1.0.0
- **Build**: 1
- **Deployment Target**: iOS 13.0+

### Required Capabilities

- Local Notifications (enabled by default via Capacitor)
- No push notifications (APNs) yet
- No HealthKit unless `VITE_ENABLE_HEALTH_INTEGRATION=true`

## Smoke Test Checklist

After installation, verify these core features:

### Basic Functionality
- [ ] App opens without crashes
- [ ] Dark/light theme toggle works
- [ ] Language toggle works (English/Spanish)

### Core Features
- [ ] Add a drink entry
- [ ] Edit an entry
- [ ] Delete an entry (with undo)
- [ ] View statistics on Stats tab
- [ ] Set daily/weekly goals
- [ ] View spending dashboard

### Data Management
- [ ] Export data to JSON
- [ ] Import data from JSON
- [ ] Verify checksum validation on import
- [ ] Clear all data (with double confirmation)

### Notifications (if enabled)
- [ ] Enable reminders in settings
- [ ] Set reminder time
- [ ] Verify permission prompt on Android 13+
- [ ] Receive test notification

### Offline Mode
- [ ] Enable airplane mode
- [ ] Add entries offline
- [ ] Data persists after app restart

## Troubleshooting

### Android

**Build fails:**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleRelease
cd ..
```

**Capacitor sync issues:**
```bash
# Remove and re-add Android platform
npx cap copy android
```

**Permission denied on gradlew:**
```bash
chmod +x android/gradlew
```

### iOS

**Code signing errors:**
- Ensure you have a valid Apple Developer account
- Select appropriate team in Xcode project settings
- Create App ID and provisioning profile in Apple Developer portal

**Build fails:**
- Clean build folder: Product > Clean Build Folder (⌘⇧K)
- Delete derived data: ~/Library/Developer/Xcode/DerivedData

### General

**Dependencies out of sync:**
```bash
rm -rf node_modules package-lock.json
npm install
npx cap sync
```

**Web assets not updating:**
```bash
npm run build
npx cap copy
```

## Performance Testing

### Load Testing

Test with substantial data:
```bash
# Add ~100 entries spanning several months
# Verify:
# - Stats calculations remain fast
# - Charts render smoothly
# - Export/import completes in <5 seconds
```

### Memory Testing

Monitor for leaks:
- Android: Android Studio Profiler
- iOS: Xcode Instruments
- Target: <100 MB memory usage under normal use

## Release Build Checklist

Before building for distribution:

- [ ] Update version numbers in:
  - `package.json`
  - `android/app/build.gradle` (versionName, versionCode)
  - `ios/App/App.xcodeproj/project.pbxproj` (MARKETING_VERSION, CURRENT_PROJECT_VERSION)
- [ ] Run full test suite: `npm test`
- [ ] Run verify: `npm run verify`
- [ ] Run security audit: `npm run audit:ci`
- [ ] Build production web assets: `npm run build`
- [ ] Sync platforms: `npx cap sync`
- [ ] Test on physical devices (not just emulators)
- [ ] Verify all feature flags are set correctly for production

## Support

For issues during device testing:
- Check [GitHub Issues](https://github.com/Zcg321/Alchohalt/issues)
- Review [GitHub Discussions](https://github.com/Zcg321/Alchohalt/discussions)
- See main [README.md](../README.md) for additional documentation
