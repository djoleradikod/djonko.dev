// What the hub's "Where things stand" strip shows. Every date and basis here is copied unchanged from the
// note upgrades/support-clock, which carries the sources. Change that note first, then this file. The hub's
// build fails if a date, basis or release named here no longer appears in the note's text.
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
  { item: 'vSphere 8', family: 'other', date: '11 Oct 2027', basis: 'Broadcom', end: '2027-10-11' },
  // Broadcom gives the month. The bar stops at the note's derived day, 12 Aug 2028, and the strip says so.
  { item: 'VCF 9.1 and 9.1.1', family: 'v9', date: 'August 2028', basis: 'Broadcom for the month; derived for the day; tracker shows the day', end: '2028-08-12' },
];

/** The strings the note must still contain for this file to be current. */
export const MUST_APPEAR_IN_NOTE = [
  CURRENT_RELEASE.name, CURRENT_RELEASE.date, NEXT_RELEASE.plan, '12 Aug 2028',
  '## VCF 5.0 and 5.1: the date is unresolved', // the heading behind the anchor on the 5.0 and 5.1 row
  ...SUPPORT_ENDS.flatMap((r) => [r.item, r.date, r.basis]),
];
