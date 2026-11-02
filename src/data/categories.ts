export const CATEGORIES = [
  { id: 'architecture', title: 'Architecture: from 5.x to 9.x', short: 'Architecture',
    blurb: 'How the pieces fit together in VCF 9, and how that differs from the domain-centred model of 5.x.' },
  { id: 'upgrades', title: 'Upgrades and migrations', short: 'Upgrades',
    blurb: 'Paths, order, prechecks and checkpoints for moving from 5.x to 9.0 and on to 9.1.' },
  { id: 'day-2', title: 'Day-2 operations', short: 'Day-2',
    blurb: 'Certificates, passwords, backups, hosts and housekeeping, and where each task lives now.' },
  { id: 'licensing', title: 'Licensing and entitlements', short: 'Licensing',
    blurb: 'From license keys to license files: registration, reporting, grace periods and errors.' },
  { id: 'troubleshooting', title: 'Troubleshooting playbooks', short: 'Troubleshooting',
    blurb: 'Following a problem from first symptom to resolution, with logs, methods and worked examples.' },
  { id: 'integrations', title: 'Integrations and observability', short: 'Integrations',
    blurb: 'Adapters, cloud proxies, plugins, compute managers and the paths between components.' },
  { id: 'labs', title: 'Labs, tooling and automation', short: 'Labs',
    blurb: 'Building labs, using the APIs and tools, and reproducing problems safely.' },
  { id: 'leadership', title: 'Consultancy and technical leadership', short: 'Leadership',
    blurb: 'Assessments, runbooks, risk, teaching and the habits that make platform teams reliable.' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as unknown as [CategoryId, ...CategoryId[]];
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id)!;
