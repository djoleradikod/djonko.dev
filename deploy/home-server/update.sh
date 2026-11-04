#!/usr/bin/env bash
# Keep a home-server copy of the site in step with the main branch.
#
# Run by the djonko-update.timer every few minutes. Each run fetches the branch; if the commit is new, or
# the site is not answering, it rebuilds and restarts the site, then checks that the home page loads.
# A run with nothing to do takes about a second. Settings come from ~/.config/djonko/preview.env, which
# install.sh writes.
set -euo pipefail

CONF="${DJONKO_CONF:-$HOME/.config/djonko/preview.env}"
# shellcheck disable=SC1090
[ -f "$CONF" ] && . "$CONF"
REPO_URL="${REPO_URL:-https://github.com/djoleradikod/djonko.dev.git}"
REPO_DIR="${REPO_DIR:-$HOME/djonko.dev}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-8090}"
BIND="${BIND:-0.0.0.0}"
SITE_URL="${SITE_URL:?set SITE_URL in $CONF}"
MODE="${MODE:-auto}"          # auto, docker or node
FORCE="${1:-}"                # --force rebuilds even when nothing changed
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/djonko"
SHARE="${XDG_DATA_HOME:-$HOME/.local/share}/djonko"
mkdir -p "$STATE" "$SHARE/releases"

log() { printf '%s %s\n' "$(date -Is)" "$*"; }

exec 9>"$STATE/lock"
flock -n 9 || { log "another update is running"; exit 0; }

if [ "$MODE" = auto ]; then
  if command -v docker >/dev/null && docker info >/dev/null 2>&1; then MODE=docker; else MODE=node; fi
fi

healthy() { curl -fs -o /dev/null --max-time 5 "http://127.0.0.1:$PORT/"; }

# Refuse to start on a port something else already holds. Once the site is up, the port is ours.
port_taken() {
  if command -v ss >/dev/null; then ss -ltnH "sport = :$PORT" | grep -q .
  else (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; fi
}
if [ ! -f "$STATE/deployed" ] && port_taken; then
  log "port $PORT is already in use by another program; pick another PORT in $CONF"
  command -v ss >/dev/null && ss -ltnp "sport = :$PORT"
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  log "cloning $REPO_URL into $REPO_DIR"
  git clone -q --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"
git fetch -q origin "$BRANCH"
target="$(git rev-parse "origin/$BRANCH")"
current="$(cat "$STATE/deployed" 2>/dev/null || true)"

if [ "$target" = "$current" ] && [ "$FORCE" != --force ] && healthy; then
  exit 0
fi
log "deploying ${target:0:7} (was ${current:0:7}) with $MODE on port $PORT"

# This checkout belongs to the updater: local edits in it are discarded.
git checkout -q -B "$BRANCH" "origin/$BRANCH"
git reset -q --hard "origin/$BRANCH"
git clean -qfdx -e node_modules

export SITE_URL PUBLIC_NOINDEX="${PUBLIC_NOINDEX:-1}" BIND PORT
case "$MODE" in
  docker)
    docker compose -p djonko -f deploy/docker/docker-compose.yml up -d --build --remove-orphans
    docker image prune -f --filter "label=org.opencontainers.image.title=djonko.dev" >/dev/null || true
    ;;
  node)
    npm ci --no-audit --no-fund --loglevel=error
    npm run build
    rel="$SHARE/releases/$target"
    rm -rf "$rel" && cp -a dist "$rel"
    ln -sfn "$rel" "$SHARE/current.new" && mv -T "$SHARE/current.new" "$SHARE/current"
    # Keep the three newest releases.
    ls -1dt "$SHARE"/releases/* | tail -n +4 | xargs -r rm -rf
    systemctl --user is-active -q djonko-serve.service || systemctl --user enable --now djonko-serve.service
    ;;
  *) log "unknown MODE $MODE"; exit 1 ;;
esac

for _ in $(seq 1 30); do healthy && break; sleep 2; done
if ! healthy; then log "the site did not answer on port $PORT after the deploy"; exit 1; fi
echo "$target" > "$STATE/deployed"

# Pick up changes to this script for the next run.
install -m 755 deploy/home-server/update.sh "$HOME/.local/bin/djonko-update"
log "live: $SITE_URL (commit ${target:0:7})"
