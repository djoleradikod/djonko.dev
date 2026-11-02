#!/usr/bin/env bash
# Publish the site to Blacknight (cPanel) web hosting over SFTP or FTPS, using lftp.
#
#   BN_HOST=ftp.example.ie BN_USER=cpaneluser BN_PASS='...' BN_DIR=public_html deploy/blacknight/deploy.sh
#   ... deploy/blacknight/deploy.sh --skip-build      upload an existing dist/ (used by CI)
#
# BN_PROTO=sftp (default) or ftps. BN_DIR is the folder the domain points at: public_html for the main
# domain of the hosting account, or the folder cPanel created for an addon domain or subdomain.
# Files that no longer exist in the build are removed from the server, except media/, .well-known/ and
# cgi-bin/. The contents of ./media are uploaded to <BN_DIR>/media and never deleted from the server.
# Shared hosting has no atomic switch: pages update file by file during the upload, which takes a minute.
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${BN_HOST:?Set BN_HOST}" "${BN_USER:?Set BN_USER}" "${BN_PASS:?Set BN_PASS}"
BN_DIR="${BN_DIR:-public_html}"
BN_PROTO="${BN_PROTO:-sftp}"
command -v lftp >/dev/null || { echo "Install lftp first (apt install lftp, or brew install lftp)."; exit 1; }

if [[ "${1:-}" != "--skip-build" ]]; then
  npm ci --no-audit --no-fund
  npm run build
fi
[[ -f dist/index.html ]] || { echo "dist/ is empty. Build first."; exit 1; }
cp deploy/blacknight/htaccess dist/.htaccess
cp deploy/blacknight/htaccess-immutable dist/_astro/.htaccess

echo "==> Mirror dist/ to ${BN_PROTO}://${BN_HOST}/${BN_DIR}"
lftp -u "$BN_USER","$BN_PASS" "${BN_PROTO}://${BN_HOST}" <<LFTP
set sftp:auto-confirm yes
set ftp:ssl-force true
set ftp:ssl-protect-data true
set net:max-retries 3
set net:timeout 30
mirror --reverse --delete --only-newer --parallel=4 --exclude-glob .well-known/ --exclude-glob cgi-bin/ --exclude-glob media/ dist/ ${BN_DIR}/
mirror --reverse --only-newer --parallel=2 --exclude-glob README.md media/ ${BN_DIR}/media/
bye
LFTP
echo "Uploaded. Check https://<your domain>/ in a private window."
