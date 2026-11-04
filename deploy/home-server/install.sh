#!/usr/bin/env bash
# Set up a home server to serve the site and follow the main branch on its own.
#
#   curl -fsSL https://raw.githubusercontent.com/djoleradikod/djonko.dev/main/deploy/home-server/install.sh | PORT=8090 bash
#
# Runs as an ordinary user. Safe to run again. It writes ~/.config/djonko/preview.env, installs
# ~/.local/bin/djonko-update and three systemd user units, deploys once, and prints the address.
# It never stops or reconfigures anything else on the machine, and it will not take a port another
# program already holds.
set -euo pipefail

PORT="${PORT:-8090}"
BRANCH="${BRANCH:-main}"
INTERVAL="${INTERVAL:-5min}"
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
SITE_URL="${SITE_URL:-http://${LAN_IP:-127.0.0.1}:$PORT}"
RAW="https://raw.githubusercontent.com/djoleradikod/djonko.dev/$BRANCH/deploy/home-server"
CONF_DIR="$HOME/.config/djonko"
UNIT_DIR="$HOME/.config/systemd/user"
mkdir -p "$CONF_DIR" "$UNIT_DIR" "$HOME/.local/bin"

if [ ! -f "$CONF_DIR/preview.env" ] || [ "${FORCE:-}" = 1 ]; then
  cat > "$CONF_DIR/preview.env" <<CONF
# Read by djonko-update. Change a value, then run: djonko-update --force
PORT=$PORT
BIND=0.0.0.0
SITE_URL=$SITE_URL
BRANCH=$BRANCH
PUBLIC_NOINDEX=1
MODE=auto
CONF
fi
# shellcheck disable=SC1091
. "$CONF_DIR/preview.env"

here="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
if [ -n "$here" ] && [ -f "$here/update.sh" ]; then
  install -m 755 "$here/update.sh" "$HOME/.local/bin/djonko-update"
else
  curl -fsSL "$RAW/update.sh" -o "$HOME/.local/bin/djonko-update" && chmod 755 "$HOME/.local/bin/djonko-update"
fi

cat > "$UNIT_DIR/djonko-update.service" <<UNIT
[Unit]
Description=Update the djonko.dev home-server copy from GitHub
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=%h/.local/bin/djonko-update
TimeoutStartSec=20min
UNIT

cat > "$UNIT_DIR/djonko-update.timer" <<UNIT
[Unit]
Description=Check GitHub for djonko.dev changes every $INTERVAL

[Timer]
OnBootSec=2min
OnUnitActiveSec=$INTERVAL
Persistent=true

[Install]
WantedBy=timers.target
UNIT

# Used only when Docker is not available to this user.
cat > "$UNIT_DIR/djonko-serve.service" <<UNIT
[Unit]
Description=Serve the djonko.dev home-server copy (no Docker)

[Service]
ExecStart=/usr/bin/python3 -m http.server $PORT --bind ${BIND:-0.0.0.0} --directory %h/.local/share/djonko/current
Restart=on-failure

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now djonko-update.timer

# Timers run while the user is logged out only with lingering on.
if [ "$(loginctl show-user "$USER" -p Linger --value 2>/dev/null)" != yes ]; then
  loginctl enable-linger "$USER" 2>/dev/null \
    || sudo -n loginctl enable-linger "$USER" 2>/dev/null \
    || echo "NOTE: run 'sudo loginctl enable-linger $USER' once so updates continue while you are logged out."
fi

# Let the local network in if ufw is on and sudo needs no password; otherwise say what to run.
if command -v ufw >/dev/null && sudo -n true 2>/dev/null; then
  if sudo -n ufw status | grep -q '^Status: active'; then
    subnet="$(ip -o -f inet addr show | awk -v ip="$LAN_IP" '$4 ~ "^"ip"/" {print $4}' | head -1)"
    [ -n "$subnet" ] && sudo -n ufw allow from "$(python3 -c "import ipaddress,sys;print(ipaddress.ip_interface(sys.argv[1]).network)" "$subnet")" to any port "$PORT" proto tcp
  fi
elif command -v ufw >/dev/null; then
  echo "NOTE: if ufw is on, run: sudo ufw allow from <your LAN>/24 to any port $PORT proto tcp"
fi

"$HOME/.local/bin/djonko-update" --force
echo
echo "Site:    $SITE_URL"
echo "Status:  systemctl --user list-timers djonko-update.timer; journalctl --user -u djonko-update -n 50"
echo "Update:  djonko-update --force"
echo "Stop:    systemctl --user disable --now djonko-update.timer; docker compose -p djonko down (or systemctl --user disable --now djonko-serve)"
