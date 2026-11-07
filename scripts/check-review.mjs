// Every note carries a date its sources were last checked, plus sources to check.
// Usage: node scripts/check-review.mjs          fail on any note missing a check date or sources; report past review dates
//        STRICT_REVIEW=1 node scripts/check-review.mjs   also fail on a past review date
// Stale means past reviewDue when a note sets one, otherwise older than MAX_AGE_DAYS (default 180).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content/articles';
const MAX_AGE_DAYS = Number(process.env.MAX_AGE_DAYS ?? 180);
const today = process.env.TODAY ? new Date(process.env.TODAY) : new Date();
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(p) && files.push(p); } })(ROOT);

const field = (fm, name) => (fm.match(new RegExp(`^${name}:[ \\t]*["']?([^"'\\n]+)`, 'm')) ?? [])[1];
const missing = [], noSources = [], stale = [];
let notes = 0;
for (const f of files) {
  const fm = (readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/) ?? [])[1] ?? '';
  if (/^draft:\s*true/m.test(fm)) continue;
  notes++;
  const reviewed = field(fm, 'reviewed');
  const due = field(fm, 'reviewDue');
  if (!reviewed) missing.push(f);
  if (!/^sources:\s*\n\s+- /m.test(fm)) noSources.push(f);
  if (reviewed) {
    const limit = due ? new Date(due) : new Date(+new Date(reviewed) + MAX_AGE_DAYS * 86400000);
    if (today > limit) stale.push(`${f} (checked ${reviewed}${due ? `, due ${due}` : ''})`);
  }
}
const list = (label, items) => { if (items.length) { console.log(`${label}: ${items.length}`); items.slice(0, 200).forEach((i) => console.log(`  ${i}`)); } };
list('No sources-checked date', missing);
list('No sources', noSources);
list('Past review date', stale);
console.log(`${notes} notes: ${notes - missing.length} with a sources-checked date, ${notes - noSources.length} with sources, ${stale.length} past review date`);
process.exit(missing.length || noSources.length || (process.env.STRICT_REVIEW && stale.length) ? 1 : 0);
