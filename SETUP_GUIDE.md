# Enhanced Features Setup Guide

This guide walks through the steps needed to enable and deploy the enhanced features in production.

## Prerequisites

- Node.js and npm installed
- Xcode (for iOS development)
- Android Studio (for Android development)
- Physical iOS and Android devices for testing

## Step 1: Install Capacitor Plugins

The required plugins have been added to `package.json` as optional dependencies. Install them:

```bash
npm install
```

This will install:
- `@capacitor-community/apple-health-kit` (iOS)
- `@capacitor-community/fitness-activity` (Android)
- `@capacitor-community/speech-recognition` (both platforms)

If installation fails due to plugin unavailability, you can skip optional dependencies:
```bash
npm install --no-optional
```

## Step 2: Sync Capacitor

After installing plugins, sync them to native projects:

```bash
npx cap sync
```

This will:
- Copy web assets to native projects
- Update native dependencies
- Configure plugin integrations

## Step 3: Configure iOS (Apple Health)

### Enable HealthKit Capability

1. Open the iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

2. Select your app target in the project navigator

3. Go to "Signing & Capabilities" tab

4. Click "+ Capability" and add "HealthKit"

5. Configure the data types you want to access:
   - ✅ Step Count
   - ✅ Sleep Analysis
   - ✅ Heart Rate

### Update Info.plist

Add usage descriptions to `ios/App/App/Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Alchohalt uses your health data to provide insights on how alcohol affects your sleep, activity, and overall wellness.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Alchohalt may update health data to track your wellness journey.</string>
```

## Step 4: Configure Android (Google Fit)

### Add Permissions

Update `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION" />
```

### Configure Google Fit API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your project
3. Enable "Fitness API"
4. Create OAuth 2.0 credentials
5. Add the SHA-1 fingerprint of your signing key

### Update build.gradle

In `android/app/build.gradle`, add:

```gradle
dependencies {
    // ... existing dependencies
    implementation 'com.google.android.gms:play-services-fitness:21.1.0'
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

## Step 5: Configure Speech Recognition

### iOS Microphone Permission

Add to `ios/App/App/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Alchohalt uses your microphone to enable voice-activated drink logging.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>Alchohalt uses speech recognition to understand your voice commands.</string>
```

### Android Microphone Permission

Already included in the default Android manifest. No additional changes needed.

## Step 6: Enable Features via Environment Variables

Create a `.env` file in the project root (or set in your deployment environment):

```bash
# Enable all features
VITE_ENABLE_HEALTH_INTEGRATION=true
VITE_ENABLE_VOICE_LOGGING=true
VITE_ENABLE_AI_RECOMMENDATIONS=true
VITE_ENABLE_JOURNALING=true
VITE_ENABLE_THERAPY_RESOURCES=true

# Or enable selectively
# VITE_ENABLE_HEALTH_INTEGRATION=false
# VITE_ENABLE_VOICE_LOGGING=true
# etc.
```

For production deployments, set these in your hosting platform:
- **Vercel/Netlify**: Add in environment variables settings
- **Docker**: Pass as environment variables
- **Native apps**: Set in build configuration

## Step 7: Test on Physical Devices

### iOS Testing

1. Connect your iOS device
2. Build and run:
   ```bash
   npm run build:ios
   ```
3. Test each feature:
   - Health Integration: Grant HealthKit permissions when prompted
   - Voice Logging: Grant microphone permissions when prompted
   - Verify data syncs correctly

### Android Testing

1. Connect your Android device
2. Build and run:
   ```bash
   npm run build:android
   ```
3. Test each feature:
   - Health Integration: Grant Google Fit permissions when prompted
   - Voice Logging: Grant microphone permissions when prompted
   - Verify data syncs correctly

## Step 8: Verify Tests Pass

Before deploying, ensure all tests pass:

```bash
npm test
```

Expected output:
- ✅ 109 test suites passing
- ✅ 142 total tests passing

## Step 9: Build for Production

### Web/PWA Build

```bash
npm run build
```

Output will be in `dist/` directory.

### iOS Release Build

```bash
npm run build:ios
```

Then archive and submit via Xcode.

### Android Release Build

```bash
npm run build:android
```

APK will be in `android/app/build/outputs/apk/release/`.

## Step 10: Deploy Incrementally

Recommended rollout strategy:

### Phase 1: Beta Testing (Week 1)
- Enable features for internal testers
- Set `VITE_ENABLE_THERAPY_RESOURCES=true` only
- Monitor feedback and analytics

### Phase 2: Journaling & AI (Week 2-3)
- Enable for 10% of users:
  - `VITE_ENABLE_JOURNALING=true`
  - `VITE_ENABLE_AI_RECOMMENDATIONS=true`
- Monitor engagement metrics

### Phase 3: Voice Logging (Week 4)
- Enable for 25% of users:
  - `VITE_ENABLE_VOICE_LOGGING=true`
- Monitor accuracy and user satisfaction

### Phase 4: Health Integration (Week 5-6)
- Enable for 50% of users:
  - `VITE_ENABLE_HEALTH_INTEGRATION=true`
- Monitor permission grant rates
- Collect feedback on insights quality

### Phase 5: Full Rollout (Week 7+)
- Enable all features for 100% of users
- Monitor performance and crash reports
- Iterate based on user feedback

## Troubleshooting

### Health Integration Not Working

**iOS:**
- Verify HealthKit capability is enabled in Xcode
- Check Info.plist has NSHealthShareUsageDescription
- Ensure user has granted permissions in Settings > Privacy > Health

**Android:**
- Verify Google Fit API is enabled in Cloud Console
- Check SHA-1 fingerprint matches your signing key
- Ensure user has Google Fit app installed and configured

### Voice Recognition Not Working

**iOS:**
- Check NSMicrophoneUsageDescription in Info.plist
- Verify microphone permission granted in Settings > Privacy > Microphone
- Test on physical device (simulator may not support speech recognition)

**Android:**
- Ensure microphone permission granted in app settings
- Test on physical device with good internet connection
- Verify Google Play Services is up to date

### Features Not Appearing

- Check environment variables are set correctly
- Verify feature flags in `src/config/features.ts`
- Clear app cache and rebuild:
  ```bash
  npm run build
  npx cap sync
  ```

## Monitoring & Analytics

After deployment, monitor:
- **Permission Grant Rates**: Track how many users grant health/mic permissions
- **Feature Usage**: Track which features are used most
- **Error Rates**: Monitor for plugin-related errors
- **Performance**: Ensure no degradation with new features
- **User Feedback**: Collect ratings and reviews

## Support

For issues or questions:
- Check [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) for detailed feature documentation
- Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- File an issue in the GitHub repository

## Rollback Plan

If issues arise, you can disable features without redeploying:

1. Set feature flag to `false` in environment variables
2. Clear CDN cache (if using)
3. Users will see fallback UI gracefully

No code changes or redeployment needed to disable features!
