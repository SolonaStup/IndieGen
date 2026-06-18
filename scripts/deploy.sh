#!/usr/bin/env bash
# One-command deploy of INDIEGEN to the live server.
#
#   bash scripts/deploy.sh
#
# Packs the source (no node_modules/.next/.git/.env), ships it, installs any new
# deps, rebuilds Next, restarts the pm2 process, and health-checks. The server's
# .env.local and .next build cache are preserved (faster incremental builds).
#
# Override defaults via env: IG_HOST, IG_KEY, IG_APP, IG_PORT, IG_PM2.
set -euo pipefail

HOST=${IG_HOST:-root@138.124.117.129}
KEY=${IG_KEY:-$HOME/.ssh/ig_deploy}
APP=${IG_APP:-/opt/indiegen}
PORT=${IG_PORT:-3001}
PM2=${IG_PM2:-indiegen}
SSH=(ssh -i "$KEY" -o BatchMode=yes -o StrictHostKeyChecking=no)

cd "$(dirname "$0")/.."

echo "→ packing source…"
tar --exclude='./node_modules' --exclude='./.next' --exclude='./.git' \
    --exclude='./out' --exclude='./.data' --exclude='./dev.log' \
    --exclude='./.env.local' -czf /tmp/ig-deploy.tgz .

echo "→ uploading…"
scp -i "$KEY" -o BatchMode=yes -o StrictHostKeyChecking=no \
    /tmp/ig-deploy.tgz "$HOST:/root/ig-deploy.tgz"

echo "→ extract + install + build + restart (~2-3 min)…"
"${SSH[@]}" "$HOST" "set -e
  cd '$APP'
  tar -xzf /root/ig-deploy.tgz
  npm install --no-audit --no-fund --silent
  npm run build
  pm2 restart '$PM2'
  sleep 4
  if curl -sf -o /dev/null http://127.0.0.1:$PORT/; then
    echo HEALTH_OK
  else
    echo HEALTH_FAIL; pm2 logs '$PM2' --lines 25 --nostream; exit 1
  fi"

echo "✓ deployed → https://indiegen.net"
