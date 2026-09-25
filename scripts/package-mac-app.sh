#!/bin/bash
set -euo pipefail
# Preserve the old developer entry point while using the native app build.
exec bash "$(cd "$(dirname "$0")" && pwd)/build-native-app.sh" "$@"
