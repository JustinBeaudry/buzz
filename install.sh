#!/bin/bash
# Installs the Actual Reality build of Buzz Desktop (with relay agents) into /Applications.
# Usage: curl -fsSL https://github.com/JustinBeaudry/buzz/releases/latest/download/install.sh | bash
set -euo pipefail

URL="https://github.com/JustinBeaudry/buzz/releases/latest/download/Buzz-AR-arm64.zip"
SHA256="dd9f330275eb561a44b809a256dc3a15b39308c93e97fcbc4ea0ae4c141b619f"
DEST="/Applications/Buzz.app"

if [ "$(uname -s)" != "Darwin" ] || [ "$(uname -m)" != "arm64" ]; then
  echo "This build is for Apple Silicon Macs (M1 or newer) only." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading Buzz…"
curl -fL --progress-bar -o "$TMP/Buzz.zip" "$URL"

echo "Checking the download…"
echo "$SHA256  $TMP/Buzz.zip" | shasum -a 256 -c - >/dev/null || {
  echo "Checksum mismatch; not installing." >&2
  exit 1
}
ditto -x -k "$TMP/Buzz.zip" "$TMP"

if pgrep -xq buzz-desktop; then
  echo "Quitting the running Buzz…"
  osascript -e 'quit app "Buzz"' >/dev/null 2>&1 || true
  sleep 2
fi

SUDO=""
if [ -e "$DEST" ] && [ ! -w "$DEST" ] || [ ! -w /Applications ]; then
  echo "Your Mac password is needed to write to /Applications."
  SUDO="sudo"
fi
$SUDO rm -rf "$DEST"
$SUDO ditto "$TMP/Buzz.app" "$DEST"
$SUDO xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true

echo "Installed. Opening Buzz…"
open "$DEST"
