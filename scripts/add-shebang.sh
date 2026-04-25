#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 1 ]]; then
  echo "Usage: $0 <file>" >&2
  exit 2
fi

TARGET="$1"
TARGET_ABS="$(realpath "$TARGET")"

if [[ ! -f "$TARGET_ABS" ]]; then
  echo "File not found: $TARGET_ABS" >&2
  exit 3
fi

if head -n1 "$TARGET_ABS" | grep -q '^#!'; then
  echo "Shebang already present in $TARGET_ABS"
  exit 0
fi

sed -i.bak '1i\#!/usr/bin/env node' "$TARGET_ABS"
rm -f "$TARGET_ABS.bak"
chmod 755 "$TARGET_ABS"
echo "Prepended shebang and set executable mode on $TARGET_ABS"
