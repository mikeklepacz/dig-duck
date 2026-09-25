#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
xcodebuild -version
npm run mac:prepare
xcodebuild -project macos/DigDuck.xcodeproj -scheme DigDuck -configuration Release \
  -destination 'generic/platform=macOS' \
  -archivePath "$ROOT/release/DigDuck.xcarchive" archive
printf '%s\n' 'Archive created. Validate it and use Distribute App → App Store Connect in Xcode Organizer.'
