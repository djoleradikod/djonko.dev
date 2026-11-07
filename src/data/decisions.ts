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

type Dated = { data: { updated?: Date; pubDate: Date; title: string } };

/** Notes with an `updated` date, newest first. Notes first published that day lead a tie, as the newest work. */
export function latestChanges<T extends Dated>(items: T[]) {
  const changed = items
    .filter((a) => a.data.updated)
    .sort((a, b) => +b.data.updated! - +a.data.updated! || +b.data.pubDate - +a.data.pubDate || a.data.title.localeCompare(b.data.title));
  const lastDay = changed[0]?.data.updated;
  const sameDay = changed.filter((a) => +a.data.updated! === +lastDay!);
  const isNew = (a: T) => +a.data.pubDate >= +a.data.updated!;
  return { changed, lastDay, sameDayCount: sameDay.length, newCount: sameDay.filter(isNew).length, isNew };
}

/** One sentence on the latest day's changes, reading correctly for one note and when every change is a new note. */
export function changeSummary(count: number, newCount: number, day: string): string {
  const notes = `${count} ${count === 1 ? 'note' : 'notes'}`;
  if (newCount >= count) return `${count} new ${count === 1 ? 'note' : 'notes'} on ${day}.`;
  return `${notes} changed on ${day}${newCount > 0 ? `, ${newCount} of them new` : ''}.`;
}

/** A note's summary cut to its first sentence, or first two when the first is only a few words. */
export function summaryLine(description: string): string {
  const parts = description.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
  let line = parts[0] ?? '';
  for (let i = 1; line.length < 40 && parts[i]; i++) line += ` ${parts[i]}`;
  return line;
}
