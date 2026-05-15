#!/bin/zsh
set -euo pipefail

cd -- "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required."
  echo "Install it from https://nodejs.org/ and then run this file again."
  read -r "reply?Press Return to close this window."
  exit 1
fi

major_version="$(node -p "Number(process.versions.node.split('.')[0])")"
if [[ "$major_version" -lt 20 ]]; then
  echo "Node.js 20 or newer is required. Current version: $(node --version)"
  echo "Install the current LTS version from https://nodejs.org/ and then run this file again."
  read -r "reply?Press Return to close this window."
  exit 1
fi

echo "Starting Dig Duck..."
echo

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies. This can take a minute the first time."
  npm install
  echo
fi

if [[ ! -d public/wiki-images ]] || [[ -z "$(find public/wiki-images -type f -print -quit 2>/dev/null)" ]]; then
  echo "Downloading wiki guide images."
  npm run fetch:wiki
  echo
fi

open_url() {
  local url="$1"
  sleep 2
  open "$url"
}

echo "Opening Dig Duck in your browser..."
echo "Keep this window open while using the app."
echo "Press Control-C here when you are done."
echo

open_url "http://127.0.0.1:5175/" &
npm run dev
