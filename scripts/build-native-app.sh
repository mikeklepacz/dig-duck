#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUTPUT="$ROOT/release/native"
APP="$OUTPUT/Dig Duck.app"
mkdir -p "$OUTPUT"
npm run mac:prepare
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp macos/DigDuck/Info.plist "$APP/Contents/Info.plist"
# Replace only generated web output within this build, never user files.
if [ -d "$APP/Contents/Resources/Web" ]; then
  rm -r "$APP/Contents/Resources/Web"
fi
cp -R macos/Generated/Web "$APP/Contents/Resources/Web"
cp macos/DigDuck/PrivacyInfo.xcprivacy "$APP/Contents/Resources/PrivacyInfo.xcprivacy"
cp macos/DigDuck/ThirdPartyNotices.txt "$APP/Contents/Resources/ThirdPartyNotices.txt"
if [ -f macos/DigDuck/AppIcon.icns ]; then
  cp macos/DigDuck/AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"
fi
SDK="$(xcrun --sdk macosx --show-sdk-path)"
for ARCH in arm64 x86_64; do
  xcrun swiftc -swift-version 5 -O -sdk "$SDK" -target "$ARCH-apple-macosx13.0" \
    macos/DigDuck/*.swift -framework AppKit -framework WebKit \
    -o "$OUTPUT/DigDuck-$ARCH"
done
xcrun lipo -create "$OUTPUT/DigDuck-arm64" "$OUTPUT/DigDuck-x86_64" -output "$APP/Contents/MacOS/DigDuck"
# Ad hoc by default for local QA. Public distribution requires the proper
# Developer ID or Mac App Store identity and provisioning, never this signature.
codesign --force --options runtime --sign "${DIG_DUCK_SIGN_IDENTITY:--}" \
  --entitlements macos/DigDuck/DigDuck.entitlements "$APP"
codesign --verify --strict --verbose=2 "$APP"
printf '%s\n' "$APP"
