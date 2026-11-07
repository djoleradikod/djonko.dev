#!/usr/bin/env bash
# One-time setup of a Hetzner Ubuntu 24.04 host for djonko.dev. Safe to run again.
#
#   scp deploy/hetzner/bootstrap.sh deploy/hetzner/Caddyfile root@<server>:/root/
#   ssh root@<server> 'DOMAIN=djonko.dev EMAIL=you@example.com DEPLOY_KEY="ssh-ed25519 AAAA... ci" bash /root/bootstrap.sh'
#
# Installs Caddy (automatic HTTPS, HTTP/3) from its official repository, creates a `deploy` user that can
# only write the site folder, opens ports 80/443 in ufw (keeping SSH), and turns on unattended security updates.
set -euo pipefail

DOMAIN="${DOMAIN:-djonko.dev}"
EMAIL="${EMAIL:?Set EMAIL for certificate expiry notices}"
DEPLOY_KEY="${DEPLOY_KEY:-}"
SSH_PORT="${SSH_PORT:-22}"
ROOT="/srv/${DOMAIN}"
HERE="$(cd "$(dirname "$0")" && pwd)"

[[ $EUID -eq 0 ]] || { echo "Run as root."; exit 1; }
. /etc/os-release
[[ "$ID" == ubuntu ]] || echo "Warning: written for Ubuntu 24.04, found $PRETTY_NAME."

echo "==> Packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -yq debian-keyring debian-archive-keyring apt-transport-https curl gnupg rsync ufw unattended-upgrades

if ! command -v caddy >/dev/null; then
  echo "==> Caddy (official repository)"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -yq caddy
fi

echo "==> Deploy user and site folders"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys && chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
if [[ -n "$DEPLOY_KEY" ]] && ! grep -qF "$DEPLOY_KEY" /home/deploy/.ssh/authorized_keys; then
  echo "$DEPLOY_KEY" >> /home/deploy/.ssh/authorized_keys
fi
install -d -m 755 -o deploy -g deploy "$ROOT" "$ROOT/releases" "$ROOT/media"
if [[ ! -e "$ROOT/current" ]]; then
  install -d -m 755 -o deploy -g deploy "$ROOT/releases/initial"
  printf '<!doctype html><meta charset="utf-8"><title>%s</title><p>Site coming soon.</p>\n' "$DOMAIN" > "$ROOT/releases/initial/index.html"
  cp "$ROOT/releases/initial/index.html" "$ROOT/releases/initial/404.html"
  chown -R deploy:deploy "$ROOT/releases/initial"
  sudo -u deploy ln -sfn "releases/initial" "$ROOT/current"
fi

echo "==> Caddy config for $DOMAIN"
install -d -m 755 /var/log/caddy && chown caddy:caddy /var/log/caddy
sed -e "s|email admin@djonko\.dev|email ${EMAIL}|" -e "s|djonko\.dev|${DOMAIN}|g" "$HERE/Caddyfile" > /etc/caddy/Caddyfile.new
caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile.new
mv /etc/caddy/Caddyfile.new /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy

echo "==> Firewall (SSH on ${SSH_PORT}, HTTP, HTTPS, HTTP/3)"
ufw allow "${SSH_PORT}/tcp" >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow 443/udp >/dev/null
ufw --force enable >/dev/null
ufw status | sed 's/^/    /'

echo "==> Unattended security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades

cat <<DONE

Done. Next:
  1. Point DNS for ${DOMAIN} and www.${DOMAIN} at this server (A and AAAA records).
     Caddy gets certificates on the first request once DNS resolves here.
  2. From your laptop:  DEPLOY_HOST=deploy@<this server> deploy/hetzner/deploy.sh --media
  3. If you also use the Hetzner Cloud Firewall, allow TCP 80, 443 and UDP 443 there too.
DONE
