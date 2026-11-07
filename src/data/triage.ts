// The triage steps, shown on the cheat sheet page and, in part, on the home page.
// Each step: what to do, the command or place to look, what a good result looks like, and the next
// action when it is not good. KBs only where the next action is a KB script.
export type TriageStep = { t: string; run: string; lang?: string; where?: string; good: string; not: string };
export const TRIAGE_STEPS: TriageStep[] = [
  {
    t: 'Capture the IDs',
    where: 'Task details: SDDC Manager Tasks, or VCF Operations Build > Lifecycle > VCF Management > Tasks (9.1)',
    run: 'date -u    # keep the time with its offset, and check the offset each log file shows',
    good: 'The ticket has the task ID, the reference ID or token, the failed subtask, and the time with its UTC offset.',
    not: 'Do not retry yet. A retry creates a new task and the first failure becomes harder to find.',
  },
  {
    t: 'Read the cause',
    run: `grep -Ril "<reference-id>" /var/log/vmware/vcf/
grep -n -B 20 -A 60 "<reference-id>" /var/log/vmware/vcf/<service>/<service>.log | less`,
    good: 'The last "Caused by" names something concrete: a host, an account, a certificate, a file system.',
    not: 'Search by the minute instead of the ID, in the offset that log uses. For a management component, read the runtime pod logs (toolkit below).',
  },
  {
    t: 'Check for locks and stale credentials',
    run: `# 5.x and 9.0.x
/opt/vmware/sddc-support/sos --health-check --domain-name <domain>
# 9.1: read the lock table (KB 449148)
psql -h localhost -U postgres -d platform -c "select * from lock;"`,
    good: 'A clean run. On 5.x and 9.0.x a stale lock fails this check even with every task complete. On 9.0, so can "Failed to get details" against an ESX root account. On 9.1, no rows from a task that has ended.',
    not: 'The log line names the lock holder. In progress and really hung: cancel it (API below). Failed: fix the cause and retry, because cancel returns 409. Nothing to cancel: a lock-row KB, with a snapshot. "Failed to get details": remediate with the password that works on the component today.',
  },
  {
    t: 'Check DNS',
    run: `ip=$(dig +short <fqdn> | tail -1); dig +short -x "$ip"`,
    good: 'The reverse record returns the same FQDN, in lowercase. Run it from the component that failed.',
    not: 'Fix the record or its case, wait for the TTL, then Retry Precheck.',
  },
  {
    t: 'Check time',
    run: `chronyc tracking 2>/dev/null | grep -E 'System time|Leap' || ntpq -p
date -u`,
    good: 'Every node uses the same source and shows the same UTC time to within a second or two.',
    not: 'Fix NTP first: on 9.0 embedded SSO, drift shows as "JWT token is expired" (KB 409353). After an NTP change, confirm the setting on the appliance itself.',
  },
  {
    t: 'Check disk',
    run: `# SDDC Manager
df -h / /nfs/vmware/vcf/nfs-mount
# vCenter
df -h /storage/log /storage/seat /storage/db /storage/core`,
    good: 'No partition close to full on either appliance.',
    not: 'Collect a support bundle before you clean anything. Then use the documented clean-up, not rm: on 9.x, DELETE DOWNLOAD under Binary Management, then bundle_cleanup.py if that fails. A precheck saying "does not have enough disk space" with space free is a stale cache, and the fix is a service restart (KB 439946).',
  },
  {
    t: 'Check the path',
    run: 'curl -skv --max-time 10 https://<target>/ -o /dev/null 2>&1 | grep -E "Connected|SSL|HTTP/"',
    good: 'Connected, a TLS handshake, an HTTP status. Test from the address that makes the call: in 9.1, often a runtime node.',
    not: 'Timeout: firewall or route. TLS error: inspection proxy or untrusted CA. 403: allowlist or token.',
  },
  {
    t: 'Retry the smallest thing',
    where: 'Retry Precheck, or Retry Task. Broadcom doesn\'t document where a manual retry restarts, so check what the failed step left behind. These commands change state.',
    run: `# TOKEN: accessToken from POST https://localhost/v1/tokens (SDDC Manager admin)
# Retry a failed task
curl -sk -X PATCH -H "Authorization: Bearer $TOKEN" https://localhost/v1/tasks/<id>
# Cancel a task still in progress that will not complete (a failed one returns 409)
curl -sk -X DELETE -H "Authorization: Bearer $TOKEN" https://localhost/v1/tasks/<id>
# Cancel a failed password task
curl -sk -X DELETE -H "Authorization: Bearer $TOKEN" \\
  https://localhost/v1/credentials/tasks/<id>`,
    good: 'The task passes the step that failed.',
    not: 'Same error again: back to step 2, the cause is not fixed. Password tasks stay on the credentials path, never the generic API.',
  },
];
