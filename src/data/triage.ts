// The triage steps, shown on the cheat sheet page and, in part, on the home page.
// Each step: what to do, the command or place to look, what a good result looks like, and the next
// action when it is not good. KBs only where the next action is a KB script.
export type TriageStep = { t: string; run: string; lang?: string; where?: string; good: string; not: string };
export const TRIAGE_STEPS: TriageStep[] = [
  {
    t: 'Capture the IDs',
    where: 'Task details: SDDC Manager Tasks, or VCF Operations Build > Lifecycle > VCF Management > Tasks (9.1)',
    run: 'date -u    # logs are in UTC, the UI shows local time',
    good: 'The ticket has the task ID, the reference ID or token, the failed subtask, and the time in UTC.',
    not: 'Do not retry yet. A retry creates a new task and the first failure becomes harder to find.',
  },
  {
    t: 'Read the cause',
    run: `grep -Ril "<reference-id>" /var/log/vmware/vcf/
grep -n -B 20 -A 60 "<reference-id>" /var/log/vmware/vcf/<service>/<service>.log | less`,
    good: 'The last "Caused by" names something concrete: a host, an account, a certificate, a file system.',
    not: 'Search by the UTC minute instead of the ID. For a management component, read the runtime pod logs (toolkit below).',
  },
  {
    t: 'Check for locks and stale credentials',
    run: '/opt/vmware/sddc-support/sos --health-check --domain-name <domain>',
    good: 'No active locks, and no "Failed to get details" against an account.',
    not: 'Lock with nothing running: cancel the owner task (API below), fix why it failed, then retry. "Failed to get details": remediate with the password that works on the component today.',
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
    not: 'Fix NTP first: token errors, 401s and stalled upgrades follow drift. After an NTP change, confirm the setting on the appliance itself.',
  },
  {
    t: 'Check disk',
    run: `# SDDC Manager
df -h /data /opt /var/log 2>/dev/null
# vCenter
df -h /storage/log /storage/seat /storage/db /storage/core`,
    good: 'SDDC Manager: more than 10 GB free in /opt and more than 1 GB for the database (the precheck\'s critical limits). vCenter: no partition close to full.',
    not: 'Collect a support bundle before you clean anything. Then use the documented clean-up (bundle_cleanup.py for old bundles), not rm.',
  },
  {
    t: 'Check the path',
    run: 'curl -skv --max-time 10 https://<target>/ -o /dev/null 2>&1 | grep -E "Connected|SSL|HTTP/"',
    good: 'Connected, a TLS handshake, an HTTP status. Test from the address that makes the call: in 9.1, often a runtime node.',
    not: 'Timeout: firewall or route. TLS error: inspection proxy or untrusted CA. 403: allowlist or token.',
  },
  {
    t: 'Retry the smallest thing',
    where: 'Retry Precheck, or Retry Task: fleet and SDDC lifecycle tasks resume at the failed step. These commands change state.',
    run: `# TOKEN: accessToken from POST https://localhost/v1/tokens (SDDC Manager admin)
# Retry a failed task
curl -sk -X PATCH -H "Authorization: Bearer $TOKEN" https://localhost/v1/tasks/<id>
# Cancel a task that will not complete
curl -sk -X DELETE -H "Authorization: Bearer $TOKEN" https://localhost/v1/tasks/<id>
# Cancel a failed password task
curl -sk -X DELETE -H "Authorization: Bearer $TOKEN" \\
  https://localhost/v1/credentials/tasks/<id>`,
    good: 'The task resumes and passes the failed step.',
    not: 'Same error again: back to step 2, the cause is not fixed. Password tasks are cancelled and run again, never retried with the generic API.',
  },
];
