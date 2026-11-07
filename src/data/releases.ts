// What the hub's "Where things stand" strip shows. Every date and basis here is copied unchanged from the
// note upgrades/support-clock, which carries the sources. Change that note first, then this file. The hub's
// build fails if a row here no longer matches the note's tables: see noteProblems below.
export const SUPPORT_NOTE = 'upgrades/support-clock';

export const CURRENT_RELEASE = { name: 'VCF 9.1.1.0', iso: '2026-09-03', date: '3 Sep 2026' };
export const NEXT_RELEASE = { name: 'Unnamed', plan: 'Q1FY27' };

// The scale of the timeline, the same one as the diagram in the note.
export const AXIS = {
  from: '2026-11-06',
  fromLabel: '6 Nov 2026',
  to: '2028-10-01',
  ticks: [
    { iso: '2027-07-01', label: 'Jul 2027' },
    { iso: '2028-01-01', label: 'Jan 2028' },
    { iso: '2028-07-01', label: 'Jul 2028' },
  ],
};

export type SupportEnd = {
  item: string;
  noteItem?: string; // the row's name in the note, where it differs from the label shown here
  family: 'v5' | 'v9' | 'other';
  date: string; // as the note's "Support ends" table writes it
  basis: string; // the same table's Basis column, word for word
  end: string; // where the bar stops
  unresolvedTo?: string; // an unresolved date runs on to here as a dashed stretch
  anchor?: string; // heading in the note that sets out the disagreement
};

export const SUPPORT_ENDS: SupportEnd[] = [
  { item: 'VCF 5.0 and 5.1', family: 'v5', date: '1 Jun 2027 or 11 Oct 2027', basis: 'Unresolved', end: '2027-06-01', unresolvedTo: '2027-10-11', anchor: 'vcf-50-and-51-the-date-is-unresolved' },
  { item: 'VCF 9.0', family: 'v9', date: '17 Sep 2027', basis: 'Broadcom; derived sum agrees', end: '2027-09-17' },
  { item: 'VCF 5.2.x', family: 'v5', date: '11 Oct 2027', basis: 'Broadcom; tracker and press agree', end: '2027-10-11' },
  { item: 'vSphere 8', noteItem: 'ESXi, vCenter and vSAN 8.x', family: 'other', date: '11 Oct 2027', basis: 'Broadcom', end: '2027-10-11' },
  // Broadcom gives the month. The bar stops at the note's derived day, 12 Aug 2028, and the strip says so.
  { item: 'VCF 9.1 and 9.1.1', family: 'v9', date: 'August 2028', basis: 'Broadcom for the month; derived for the day; tracker shows the day', end: '2028-08-12' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The dates in a table cell, as 2027-06-01 for "1 Jun 2027" and 2028-08 for "August 2028". */
function isoDates(text: string): string[] {
  return [...text.matchAll(/(?:(\d{1,2}) )?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})/g)].map(([, day, month, year]) => {
    const m = String(MONTHS.indexOf(month) + 1).padStart(2, '0');
    return day ? `${year}-${m}-${day.padStart(2, '0')}` : `${year}-${m}`;
  });
}

/** Everything in this file that no longer matches the note's tables. An empty list means it is current. */
export function noteProblems(body: string): string[] {
  const problems: string[] = [];
  const section = (heading: string) => body.split(/^## /m).find((s) => s.startsWith(`${heading}\n`)) ?? '';
  const row = (text: string, name: string) =>
    text.split('\n').find((line) => line.startsWith(`| ${name} |`))?.split(' | ').map((cell) => cell.trim());

  const ends = section('Support ends');
  for (const r of SUPPORT_ENDS) {
    const name = r.noteItem ?? r.item;
    const cells = row(ends, name);
    if (!cells) { problems.push(`no "Support ends" row named "${name}"`); continue; }
    // A cell may add a detail in brackets after the date, as "August 2028 (day: 12 Aug)" does.
    if (cells[1] !== r.date && !cells[1].startsWith(`${r.date} (`)) problems.push(`${name}: the note says "${cells[1]}", this file "${r.date}"`);
    if (cells[2] !== r.basis) problems.push(`${name}: the note's basis is "${cells[2]}", this file's "${r.basis}"`);
    const [first, second] = isoDates(r.date);
    if (!first || !r.end.startsWith(first)) problems.push(`${r.item}: the bar stops at ${r.end}, but the date reads "${r.date}"`);
    if (r.unresolvedTo !== second) problems.push(`${r.item}: the unresolved span runs to ${r.unresolvedTo}, but the date reads "${r.date}"`);
  }

  const releases = section('Releases');
  const current = row(releases, `**${CURRENT_RELEASE.name.replace('VCF ', '')}, current**`);
  if (current?.[1] !== CURRENT_RELEASE.date) problems.push(`current release: the note says "${current?.[1]}", this file "${CURRENT_RELEASE.name}, ${CURRENT_RELEASE.date}"`);
  const next = row(releases, `Next release, ${NEXT_RELEASE.name.toLowerCase()}`);
  if (!next?.[1].includes(`"${NEXT_RELEASE.plan}"`)) problems.push(`next release: the note says "${next?.[1]}", this file "${NEXT_RELEASE.name}, ${NEXT_RELEASE.plan}"`);

  // The derived day the 9.1 bar uses, and the heading behind the anchor on the 5.0 and 5.1 row.
  for (const s of ['12 Aug 2028', '## VCF 5.0 and 5.1: the date is unresolved']) {
    if (!body.includes(s)) problems.push(`not found in the note: ${s}`);
  }
  return problems;
}
