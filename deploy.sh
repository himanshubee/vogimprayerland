#!/bin/bash
# Safe deploy for vogimprayerland.org
# - Switches the port to a tiny maintenance server during the deploy
#   (no nginx config changes needed — the SAME port is reused throughout).
# - Builds first; only swaps to the new build if the build AND a runtime
#   healthcheck both succeed.
# - On any failure, the previous code + .next build are restored and pm2
#   starts the real app again on the old build.
#
# IMPORTANT: PORT below MUST match the port in package.json "start"
# (currently `next start -p 4830`) and your nginx proxy_pass target.

PROJECT_DIR="/www/wwwroot/vogimprayerland.org"
APP_NAME="vogimprayerland.org"
MAINT_NAME="vogimprayerland.org-maintenance"
BACKUP_DIR=".next.backup"
MAINT_SCRIPT="scripts/maintenance-server.js"
PORT=4830

set -u

echo "🔁 Starting safe deployment for vogimprayerland.org"

cd "$PROJECT_DIR" || { echo "❌ Project folder not found!"; exit 1; }

# Fix for Git ownership warning
git config --global --add safe.directory "$PROJECT_DIR"

# Snapshot current commit so we can roll back code on failure
PREV_COMMIT=$(git rev-parse HEAD 2>/dev/null)
echo "📌 Current commit: $PREV_COMMIT"

# Backup current .next so we can restore on failure
if [ -d ".next" ]; then
  echo "💾 Backing up current .next build..."
  rm -rf "$BACKUP_DIR"
  cp -al .next "$BACKUP_DIR" 2>/dev/null || cp -a .next "$BACKUP_DIR"
fi

start_maintenance() {
  echo "🛠️  Switching to maintenance page on :$PORT..."
  pm2 delete "$APP_NAME"   >/dev/null 2>&1
  pm2 delete "$MAINT_NAME" >/dev/null 2>&1
  # Maintenance server reads PORT from the env — bind it to the app's port.
  PORT="$PORT" pm2 start "$MAINT_SCRIPT" --name "$MAINT_NAME" --update-env
}

stop_maintenance() {
  echo "🧹 Stopping maintenance page..."
  pm2 delete "$MAINT_NAME" >/dev/null 2>&1
}

start_app() {
  echo "🚀 Starting $APP_NAME on :$PORT..."
  pm2 delete "$APP_NAME" >/dev/null 2>&1
  # `npm start` runs `next start -p 4830`. PORT is also exported so the two
  # stay in sync if the package.json script is ever switched to use $PORT.
  PORT="$PORT" pm2 start npm --name "$APP_NAME" --cwd "$PROJECT_DIR" --update-env -- start
  pm2 save >/dev/null 2>&1
}

# Poll the app until it answers (next start takes a few seconds to boot).
healthcheck() {
  echo "🩺 Health-checking http://127.0.0.1:$PORT/ ..."
  for i in $(seq 1 15); do
    if curl -fsS -o /dev/null --max-time 5 "http://127.0.0.1:$PORT/"; then
      echo "✅ Healthcheck passed (attempt $i)."
      return 0
    fi
    sleep 2
  done
  return 1
}

rollback() {
  local reason="$1"
  echo "❌ $reason"
  echo "↩️  Restoring previous state..."

  if [ -n "${PREV_COMMIT:-}" ]; then
    echo "↩️  Resetting code to $PREV_COMMIT..."
    git reset --hard "$PREV_COMMIT" >/dev/null 2>&1
  fi

  if [ -d "$BACKUP_DIR" ]; then
    echo "↩️  Restoring previous .next build..."
    rm -rf .next
    mv "$BACKUP_DIR" .next
  fi

  stop_maintenance
  start_app

  echo "⚠️  Deploy aborted. Live site restored to previous build."
  exit 1
}

# Switch to maintenance page before we touch anything risky
start_maintenance

# Pull latest code
echo "📥 Pulling latest code..."
if ! (git pull origin main 2>/dev/null || git pull origin master 2>/dev/null); then
  rollback "Git pull failed."
fi

# Install dependencies (postinstall also copies TinyMCE into public/tinymce)
echo "📦 Installing npm packages..."
if ! npm install --legacy-peer-deps --no-audit --no-fund; then
  rollback "npm install failed."
fi

# Build the app
echo "🏗️  Building Next.js app..."
if ! NODE_OPTIONS="--max-old-space-size=4096" npm run build; then
  rollback "Next.js build failed."
fi

if [ ! -f ".next/prerender-manifest.json" ]; then
  rollback "Build output missing (.next/prerender-manifest.json)."
fi

# Build OK → swap maintenance for the real app.
# Keep the backup until the healthcheck confirms the new build actually serves.
echo "🔀 Build successful — swapping in the new build..."
stop_maintenance
start_app

if ! healthcheck; then
  rollback "App did not become healthy on :$PORT after deploy."
fi

# Healthy → safe to drop the backup
echo "🧽 Clearing backup..."
rm -rf "$BACKUP_DIR"

echo "✅ Deployment complete! Live on :$PORT"
