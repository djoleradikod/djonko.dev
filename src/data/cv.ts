// CV content. The /cv/ page stays hidden (noindex, out of the sitemap and nav) until `published` is true.
// Only fill in facts you are happy to publish. Empty sections are left off the page.
export const CV = {
  published: false,
  location: '', // e.g. 'Dublin, Ireland · open to remote'
  summary:
    'VMware Cloud Foundation tech lead. I design, upgrade and troubleshoot VCF 5.x and 9.x estates, lead hard escalations to resolution, and turn what I learn into runbooks, workshops and open tools that help teams run the platform themselves.',
  skills: [
    { group: 'Platform', items: ['VMware Cloud Foundation 5.x and 9.x', 'vSphere and ESX', 'vSAN', 'NSX', 'SDDC Manager', 'VCF Operations', 'VCF Automation', 'Identity broker and SSO'] },
    { group: 'Lifecycle', items: ['Upgrade planning 5.2 to 9.x', 'vLCM images', 'Certificates and passwords at scale', 'Backup and restore', 'Licensing in VCF 9'] },
    { group: 'Troubleshooting', items: ['Structured triage', 'Log analysis', 'Services runtime (Kubernetes) diagnostics', 'Escalations with evidence'] },
    { group: 'Automation', items: ['PowerCLI', 'Python', 'REST APIs', 'Terraform provider for VCF', 'Holodeck and nested labs'] },
    { group: 'Leadership', items: ['Enablement and workshops', 'Runbooks and decision records', 'Go/no-go and rollback planning', 'Post-incident reviews'] },
  ],
  // { role: 'VCF Tech Lead', org: 'Company', start: '2023', end: 'Present', points: ['Outcome with a number', '...'] }
  experience: [] as { role: string; org: string; start: string; end: string; points: string[] }[],
  // { name: 'VMware Certified Professional – VCF Administrator', issuer: 'Broadcom', year: '2025', url: '' }
  certifications: [] as { name: string; issuer: string; year: string; url?: string }[],
  education: [] as { name: string; org: string; year: string }[],
  languages: [] as string[],
};
