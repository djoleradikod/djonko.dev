#!/usr/bin/env bash
# The gate for this repo: what a change has to pass before it merges to main.
# A clean install, the project facts refresh, the build (search index, share images, privacy scan, link
# check, review dates), the browser audit of every page, and the Caddy config check.
#
#   npm run gate                 check the commit you have checked out
#   npm run gate -- --status     also record the result on GitHub as a commit status named "gate" (needs gh)
#   npm run gate -- --external   also check every external link. Third-party sites fail for reasons unrelated
#                                to a change, so this reports its result without failing the gate.
#
# It works on a clean export of HEAD, so uncommitted work can't change the result and your tree stays as it is.
# The audit needs Chromium: a Playwright browser, or CHROMIUM_PATH pointing at one. GATE_DIR sets where the
# export goes, for machines with a small /tmp.
set -uo pipefail

post_status=0
external=0
for arg in "$@"; do
  case "$arg" in
    --status) post_status=1 ;;
    --external) external=1 ;;
    *) echo "gate: unknown option $arg" >&2; exit 2 ;;
  esac
done

repo="$(git rev-parse --show-toplevel)" || exit 2
cd "$repo" || exit 2
sha="$(git rev-parse HEAD)"
work="$(mktemp -d "${GATE_DIR:-${TMPDIR:-/tmp}}/gate.XXXXXX")" || exit 2
trap 'rm -rf "$work"' EXIT

failed=""
step() {
  local name="$1"
  shift
  echo
  echo "=== gate: $name"
  if ! "$@"; then
    failed="$name"
    return 1
  fi
}

validate_caddy() {
  if command -v caddy >/dev/null; then
    # The config writes its access log under /var/log, which needs root, so check a copy that logs here instead.
    mkdir -p "$work/caddy-log" || return 1
    sed "s#/var/log/caddy#$work/caddy-log#g" deploy/hetzner/Caddyfile >"$work/Caddyfile.check" || return 1
    caddy validate --adapter caddyfile --config "$work/Caddyfile.check"
  elif command -v docker >/dev/null; then
    docker run --rm -v "$PWD/deploy/hetzner/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2 caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile
  else
    echo "Neither caddy nor docker is available, so the Caddy config can't be checked." >&2
    return 1
  fi
}

run_checks() {
  git archive HEAD | tar -x -C "$work" || return 1
  cd "$work" || return 1
  step "install" npm ci --no-audit --no-fund &&
    step "refresh tool facts" npm run sync:projects &&
    step "build, privacy scan, link check" npm run build &&
    step "browser audit" npm run audit &&
    step "Caddy config" validate_caddy
}

run_checks
result=$?
if [ "$result" -eq 0 ] && [ "$external" -eq 1 ]; then
  echo
  echo "=== gate: external links (reported, doesn't fail the gate)"
  (cd "$work" && npm run check:external)
  echo "external links exit $?"
fi

cd "$repo" || exit 2
if [ "$post_status" -eq 1 ]; then
  if [ "$result" -eq 0 ]; then state=success; text="All checks passed"; else state=failure; text="Failed: ${failed:-export}"; fi
  gh api -X POST "repos/{owner}/{repo}/statuses/$sha" -f state="$state" -f context=gate -f description="$text" >/dev/null ||
    echo "gate: couldn't record the commit status" >&2
fi

echo
if [ "$result" -eq 0 ]; then
  echo "gate: PASS $sha"
else
  echo "gate: FAIL $sha at ${failed:-export}"
fi
exit "$result"
