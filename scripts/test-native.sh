#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/dig-duck-test.XXXXXX")"
trap 'rm -r "$TEST_DIR"' EXIT
xcrun swiftc -swift-version 5 macos/DigDuck/SaveReader.swift macos/Tests/SaveReaderTests.swift -o "$TEST_DIR/reader-tests"
"$TEST_DIR/reader-tests"
node --import tsx --test scripts/tests/native.test.ts
