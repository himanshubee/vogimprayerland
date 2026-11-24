#!/bin/bash
# Daily auto-blog tick. The app only writes when Admin > Auto-blog is enabled
# and the chosen frequency says a run is due, so running this daily is safe.
cd /www/wwwroot/vogimprayerland.org || exit 1
TOKEN=$(grep -h '^AUTOBLOG_TOKEN=' .env.production.local .env.production .env.local 2>/dev/null | head -1 | cut -d= -f2- | tr -d "\"'")
[ -z "$TOKEN" ] && { echo "$(date -u +%FT%TZ) AUTOBLOG_TOKEN not set"; exit 1; }
echo "$(date -u +%FT%TZ) $(curl -sS -m 900 -X POST http://127.0.0.1:4830/api/admin/autoblog/ -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}')"
