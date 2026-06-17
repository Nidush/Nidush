#!/usr/bin/env bash
set -euo pipefail

KEYSTORE="android/app/debug.keystore"
STOREPASS="android"
KEYPASS="android"
ALIAS="androiddebugkey"

if ! command -v keytool >/dev/null 2>&1; then
  echo "keytool not found. Install a JDK first." >&2
  exit 1
fi

if [ ! -f "$KEYSTORE" ]; then
  echo "Debug keystore not found at $KEYSTORE" >&2
  exit 1
fi

keytool -list -v \
  -keystore "$KEYSTORE" \
  -storepass "$STOREPASS" \
  -alias "$ALIAS" \
  -keypass "$KEYPASS" | sed -n 's/^[[:space:]]*SHA1:[[:space:]]*//p'
