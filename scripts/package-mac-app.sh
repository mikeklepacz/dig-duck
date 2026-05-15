#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('${ROOT}/package.json').version")"
BUILD_DIR="${ROOT}/release"
APP_DIR="${BUILD_DIR}/Dig Duck.app"
PACKAGE_DIR="${BUILD_DIR}/Dig Duck ${VERSION}"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
APP_RESOURCES="${RESOURCES_DIR}/app"
NODE_BIN="${commands[node]:A}"

rm -rf "${BUILD_DIR}"
mkdir -p "${MACOS_DIR}" "${APP_RESOURCES}"

cd "${ROOT}"
npm run build
npx esbuild server/index.ts --bundle --platform=node --format=cjs --outfile="${APP_RESOURCES}/server.cjs"

cp "${NODE_BIN}" "${RESOURCES_DIR}/node"
cp -R dist "${APP_RESOURCES}/dist"
mkdir -p "${APP_RESOURCES}/src"
cp -R src/data "${APP_RESOURCES}/src/data"

cat > "${MACOS_DIR}/Dig Duck" <<'APP'
#!/bin/zsh
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/../Resources/app" && pwd)"
NODE_BIN="$(cd "$(dirname "$0")/../Resources" && pwd)/node"
PORT="4174"
URL="http://127.0.0.1:${PORT}/"

export DIG_DUCK_APP_ROOT="${APP_ROOT}"
export API_PORT="${PORT}"
export PORT="${PORT}"

"${NODE_BIN}" "${APP_ROOT}/server.cjs" &
SERVER_PID="$!"

cleanup() {
  kill "${SERVER_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

sleep 1
open "${URL}"
wait "${SERVER_PID}"
APP
chmod +x "${MACOS_DIR}/Dig Duck"

cat > "${CONTENTS_DIR}/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>Dig Duck</string>
  <key>CFBundleIdentifier</key>
  <string>com.digduck.app</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Dig Duck</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${VERSION}</string>
  <key>CFBundleVersion</key>
  <string>${VERSION}</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

codesign --force --deep --sign - "${APP_DIR}" >/dev/null

mkdir -p "${PACKAGE_DIR}"
mv "${APP_DIR}" "${PACKAGE_DIR}/Dig Duck.app"
cp "${ROOT}/START HERE.txt" "${PACKAGE_DIR}/START HERE.txt"

cd "${BUILD_DIR}"
zip -qr -X "Dig-Duck-${VERSION}-mac.zip" "Dig Duck ${VERSION}"
echo "${BUILD_DIR}/Dig-Duck-${VERSION}-mac.zip"
