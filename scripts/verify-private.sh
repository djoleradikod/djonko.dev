#!/usr/bin/env bash
# Check that a pre-launch deployment is closed to the public and to search engines.
# Usage: scripts/verify-private.sh https://djonko-dev.pages.dev [https://<hash>.djonko-dev.pages.dev ...]
# Read-only: sends HEAD and GET requests, changes nothing.
set -uo pipefail
[ $# -ge 1 ] || { echo "usage: $0 <url> [url ...]" >&2; exit 2; }
fail=0
for url in "$@"; do
  url="${url%/}/"
  headers="$(curl -sS -o /dev/null -D - --max-time 15 "$url" | tr -d '\r')"
  code="$(printf '%s\n' "$headers" | awk 'NR==1{print $2}')"
  loc="$(printf '%s\n' "$headers" | awk -F': ' 'tolower($1)=="location"{print $2}')"
  if [[ "$code" =~ ^30[0-9]$ && "$loc" == *cloudflareaccess.com* ]]; then
    echo "PASS  $url  behind Cloudflare Access ($code to the sign-in page)"
  else
    echo "FAIL  $url  answered $code without an Access sign-in; the site is public"; fail=1
    printf '%s\n' "$headers" | grep -qi '^x-robots-tag: *noindex' \
      && echo "      X-Robots-Tag: noindex is set, so it stays out of search results" \
      || echo "      and X-Robots-Tag: noindex is missing"
    curl -sS --max-time 15 "${url}robots.txt" | grep -q '^Disallow: /$' \
      && echo "      robots.txt disallows everything" \
      || echo "      robots.txt allows crawling"
  fi
done
exit $fail
