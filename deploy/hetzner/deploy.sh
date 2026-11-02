#!/usr/bin/env bash
# Build the site and publish it to the Hetzner host as a new release, switched in atomically.
#
#   DEPLOY_HOST=deploy@203.0.113.10 deploy/hetzner/deploy.sh             build and deploy
#   DEPLOY_HOST=... deploy/hetzner/deploy.sh --media                      also sync ./media to /media
#   DEPLOY_HOST=... deploy/hetzner/deploy.sh --skip-build                 deploy an existing dist/ (used by CI)
#
# Each release is a full copy under releases/<time>-<commit>; unchanged files are hard-linked to the previous
# release, so uploads are small. `current` flips to the new release in one rename. The last KEEP releases stay
# on the server for instant rollback (deploy/hetzner/rollback.sh).
set -euo pipefail
cd "$(dirname "$0")/../.."

HOST="${DEPLOY_HOST:?Set DEPLOY_HOST, for example deploy@203.0.113.10}"
DOMAIN="${DOMAIN:-djonko.dev}"
ROOT="${DEPLOY_ROOT:-/srv/${DOMAIN}}"
KEEP="${KEEP_RELEASES:-5}"
SSH_OPTS=(${SSH_OPTS:-})
BUILD=1; MEDIA=0
for a in "$@"; do case "$a" in --skip-build) BUILD=0 ;; --media) MEDIA=1 ;; *) echo "Unknown option $a"; exit 2 ;; esac; done

if [[ $BUILD == 1 ]]; then
  echo "==> Build (includes privacy scan and link check)"
  npm ci --no-audit --no-fund
  npm run build
fi
[[ -f dist/index.html ]] || { echo "dist/ is empty. Build first."; exit 1; }

echo "==> Pre-compress text files (served by Caddy as .br/.gz)"
node scripts/precompress.mjs dist

ID="$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo local)"
PREV="$(ssh "${SSH_OPTS[@]}" "$HOST" "readlink -f '$ROOT/current' 2>/dev/null || true")"
echo "==> Upload release $ID${PREV:+ (hard-linking unchanged files from $(basename "$PREV"))}"
rsync -az --delete --chmod=D755,F644 -e "ssh ${SSH_OPTS[*]}" ${PREV:+--link-dest="$PREV"} dist/ "$HOST:$ROOT/releases/$ID/"

echo "==> Switch current -> $ID"
ssh "${SSH_OPTS[@]}" "$HOST" "set -e; cd '$ROOT'; ln -sfn 'releases/$ID' current.new && mv -T current.new current
  ls -1dt releases/*/ | tail -n +$((KEEP + 1)) | grep -v '/initial/' | xargs -r rm -rf"

if [[ $MEDIA == 1 ]]; then
  echo "==> Sync media/ (adds and updates; never deletes on the server)"
  rsync -az --chmod=D755,F644 --exclude README.md -e "ssh ${SSH_OPTS[*]}" media/ "$HOST:$ROOT/media/"
fi

if [[ "${SMOKE_TEST:-1}" == 1 ]]; then
  echo "==> Smoke test"
  for p in / /vcf/ /blog/ /projects/ /sitemap-index.xml /pagefind/pagefind.js; do
    code="$(curl -s -o /dev/null -w '%{http_code}' "https://${DOMAIN}${p}" || true)"
    printf '    %-28s %s\n' "$p" "$code"
    [[ "$code" == 200 ]] || { echo "Smoke test failed for $p. Roll back with deploy/hetzner/rollback.sh"; exit 1; }
  done
fi
echo "Deployed $ID to https://${DOMAIN}/"
