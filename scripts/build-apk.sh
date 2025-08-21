#!/usr/bin/env bash
set -euo pipefail
node --version
npm --version
npm ci
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
echo "APK path: app/build/outputs/apk/release/app-release.apk"
