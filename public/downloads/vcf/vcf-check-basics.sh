#!/usr/bin/env bash
# vcf-check-basics.sh: read-only pre-flight check of name resolution and reachability for VCF components.
#
# Step 5 of the triage method ("check the basics") as a script. For every FQDN in a list it checks:
#   - forward lookup (name -> IPv4)
#   - reverse lookup (IPv4 -> name), and that it matches the forward name
#   - that the name is lowercase (mixed-case records cause certificate and SSO mismatches)
#   - optionally, that TCP 443 answers from this machine
# It changes nothing. Run it from the machine the failing workflow runs on (for example SDDC Manager
# or a VCF Operations node), because that is the view of DNS that matters.
#
# Usage:  ./vcf-check-basics.sh hosts.txt            one FQDN per line, # for comments
#         ./vcf-check-basics.sh -p hosts.txt         also test TCP 443
#         printf 'vc01.rainpole.io\n' | ./vcf-check-basics.sh -
#
# Exit code: 0 when every check passes, 1 when anything fails.
# Source: https://djonko.dev/vcf/library/troubleshooting/seven-step-triage/   Licence: MIT
set -uo pipefail

PORT_CHECK=0
if [[ "${1:-}" == "-p" ]]; then PORT_CHECK=1; shift; fi
INPUT="${1:-}"
[[ -n "$INPUT" ]] || { sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
[[ "$INPUT" == "-" || -r "$INPUT" ]] || { echo "Cannot read $INPUT" >&2; exit 2; }

if [[ -t 1 ]]; then OK=$'\e[32mOK\e[0m'; BAD=$'\e[31mFAIL\e[0m'; WARN=$'\e[33mWARN\e[0m'; else OK=OK; BAD=FAIL; WARN=WARN; fi
fails=0; total=0

forward() { getent ahostsv4 "$1" 2>/dev/null | awk 'NR==1 {print $1}'; }
reverse() { getent hosts "$1" 2>/dev/null | awk '{print $2}' | head -n1; }
port443() { timeout 3 bash -c "exec 3<>/dev/tcp/$1/443" 2>/dev/null; }

printf '%-40s %-16s %-8s %-8s %-6s %s\n' "FQDN" "IPv4" "Forward" "Reverse" "Case" "$([[ $PORT_CHECK == 1 ]] && echo 'TCP 443')"
while IFS= read -r line || [[ -n "$line" ]]; do
  name="${line%%#*}"; name="$(echo "$name" | tr -d '[:space:]')"
  [[ -z "$name" ]] && continue
  total=$((total + 1)); row_fail=0
  ip="$(forward "$name")"
  if [[ -n "$ip" ]]; then f="$OK"; else f="$BAD"; row_fail=1; ip="-"; fi
  if [[ "$ip" != "-" ]]; then
    rname="$(reverse "$ip")"
    if [[ -z "$rname" ]]; then r="$BAD"; row_fail=1
    elif [[ "${rname,,}" == "${name,,}" || "${rname,,}" == "${name,,}." ]]; then r="$OK"
    else r="$BAD ($rname)"; row_fail=1; fi
  else r="-"; fi
  if [[ "$name" == "${name,,}" ]]; then c="$OK"; else c="$WARN"; fi
  p=""
  if [[ $PORT_CHECK == 1 && "$ip" != "-" ]]; then
    if port443 "$ip"; then p="$OK"; else p="$BAD"; row_fail=1; fi
  fi
  printf '%-40s %-16s %-8s %-8s %-6s %s\n' "$name" "$ip" "$f" "$r" "$c" "$p"
  fails=$((fails + row_fail))
done < <(if [[ "$INPUT" == "-" ]]; then cat; else cat "$INPUT"; fi)

echo
if [[ $fails -eq 0 ]]; then echo "All $total names passed."; exit 0; fi
echo "$fails of $total names failed. Fix DNS first (forward and reverse, lowercase) before retrying the workflow."
exit 1
