// Notes that end in a choice, listed on the VCF hub. Each entry is an article id (<category>/<file name>).
// The build fails if one does not exist, so a renamed note cannot leave a gap in the index.
export const DECISION_NOTES = [
  'upgrades/support-clock',
  'upgrades/upgrade-route-chooser',
  'upgrades/vcf-automation-side-by-side',
  'upgrades/converge-import-vsphere',
  'upgrades/rollback-checkpoints',
  'architecture/vsan-esa-osa',
  'value/using-what-vcf-includes',
  'value/nvme-memory-tiering',
  'licensing/november-2026-portfolio',
  'licensing/180-day-cycle',
];

/** A note's summary cut to its first sentence, or first two when the first is only a few words. */
export function summaryLine(description: string): string {
  const parts = description.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
  let line = parts[0] ?? '';
  for (let i = 1; line.length < 40 && parts[i]; i++) line += ` ${parts[i]}`;
  return line;
}
