#!/usr/bin/env bash
# Point `current` back at an earlier release. With no argument, goes back one release.
#   DEPLOY_HOST=deploy@203.0.113.10 deploy/hetzner/rollback.sh            previous release
#   DEPLOY_HOST=... deploy/hetzner/rollback.sh 20261102-113000-abc1234    a specific release
#   DEPLOY_HOST=... deploy/hetzner/rollback.sh --list                     show releases
set -euo pipefail
HOST="${DEPLOY_HOST:?Set DEPLOY_HOST}"
ROOT="${DEPLOY_ROOT:-/srv/${DOMAIN:-djonko.dev}}"
ssh ${SSH_OPTS:-} "$HOST" bash -s -- "$ROOT" "${1:-}" <<'REMOTE'
set -euo pipefail
cd "$1"; want="$2"
cur="$(basename "$(readlink -f current)")"
mapfile -t rel < <(ls -1t releases)
if [[ "$want" == --list ]]; then for r in "${rel[@]}"; do [[ $r == "$cur" ]] && echo "* $r (current)" || echo "  $r"; done; exit; fi
if [[ -z "$want" ]]; then
  for i in "${!rel[@]}"; do [[ ${rel[$i]} == "$cur" ]] && want="${rel[$((i + 1))]:-}"; done
fi
[[ -n "$want" && -d "releases/$want" ]] || { echo "No such release: ${want:-<none older than $cur>}"; exit 1; }
ln -sfn "releases/$want" current.new && mv -T current.new current
echo "current: $cur -> $want"
REMOTE
