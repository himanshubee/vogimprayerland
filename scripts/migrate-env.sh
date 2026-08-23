#!/usr/bin/env bash
#
# Fold the old tracked env files into .env.production.local — RUN ON THE SERVER
# BEFORE DEPLOYING the commit that untracks them.
#
# Why this is needed
# -----------------
# .env.local and .env.production used to be committed, so `git pull` delivered
# the server's configuration. They are untracked now, which means the next pull
# DELETES them from the server. Without this step the app comes back up with no
# MONGODB_URI, no ADMIN_PASSWORD and no gateway keys.
#
# .env.production.local is never committed and is untouched by `git pull` and
# `git reset --hard`, so it is the right home for all of it.
#
# What it does
# ------------
# Copies across only keys that .env.production.local does not already define —
# values already set there are authoritative and are never overwritten. Safe to
# run twice.
#
#   cd /path/to/vogimprayerland.org
#   bash scripts/migrate-env.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET=".env.production.local"
SOURCES=(".env.production" ".env.local")

[ -f "$TARGET" ] || { echo "Creating $TARGET"; : > "$TARGET"; }

# Back up first — this file is the only copy of the live secrets.
BACKUP="${TARGET}.backup"
cp "$TARGET" "$BACKUP"
echo "Backed up $TARGET -> $BACKUP"

existing_keys() {
  grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' "$1" 2>/dev/null | tr -d '=' || true
}

added=0
skipped=0

for src in "${SOURCES[@]}"; do
  [ -f "$src" ] || { echo "Skipping $src (not present)"; continue; }
  echo
  echo "Merging from $src:"

  while IFS= read -r key; do
    [ -n "$key" ] || continue

    value="$(grep -E "^${key}=" "$src" | head -1 | cut -d= -f2-)"
    # A blank value carries no information and would shadow a real one further
    # down the precedence chain — never copy those across.
    [ -n "$value" ] || continue

    if existing_keys "$TARGET" | grep -qx "$key"; then
      echo "  keep   $key (already set in $TARGET)"
      skipped=$((skipped + 1))
    else
      printf '%s=%s\n' "$key" "$value" >> "$TARGET"
      echo "  added  $key"
      added=$((added + 1))
    fi
  done < <(existing_keys "$src" | sort -u)
done

echo
echo "Done: $added added, $skipped already present."
echo
echo "Next:"
echo "  1. Check it over:   grep -c = $TARGET"
echo "  2. Deploy:          ./deploy.sh"
echo "  3. Once the site is confirmed healthy, delete the now-unused copies:"
echo "       rm -f .env.production .env.local $BACKUP"
echo
echo "Then ROTATE every credential that was in those files — they are still in"
echo "the GitHub history and must be treated as compromised."
