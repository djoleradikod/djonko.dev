// Flags wording that reads as filler, marketing or machine-written, so pages keep a plain engineering voice
// (the register of the Google SRE books: specific, first-person where it helps, claims backed by mechanism).
// Usage: node scripts/style-lint.mjs [--strict]   exit 1 on findings with --strict
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['src/content', 'src/pages', 'src/data/site.ts', 'src/data/categories.ts', 'src/data/cv.ts'];
const RULES = [
  ['filler or hype word', /\b(delve|delves|delving|leverag(e|es|ed|ing)|seamless(ly)?|robust|cutting[- ]edge|game[- ]chang\w*|empower\w*|elevate[sd]?|supercharg\w*|revolutioni[sz]\w*|synerg\w*|holistic|paradigm|best[- ]in[- ]class|world[- ]class|next[- ]level|state[- ]of[- ]the[- ]art|transformative|innovative|effortless(ly)?|harness(es|ing)?|streamlin\w*|unparalleled|myriad|plethora|tapestry|landscape|the realm of|navigat(e|es|ing) the|embark\w*|journey|ever[- ]evolving|dive (deep|into)|deep dive into|crucial|pivotal|vital|essential to note|it is worth noting|it's worth noting|in today's|in the world of|whether you're|look no further|rest assured|at the end of the day|unleash\w*|meticulous\w*|comprehensive guide|ultimate guide)\b/gi],
  ['AI or assistant wording', /\b(as an ai|language model|chatgpt|gpt-?\d|generative ai|ai[- ]powered|ai[- ]driven|prompt engineering|copilot)\b/gi],
  ['em dash (use a full stop, comma or colon)', /—/g],
  ['vague intensifier', /\b(very|really|truly|incredibly|extremely|super|simply|just|basically|actually|literally)\b/gi],
  ['rhetorical opener', /^(so,|well,|now,|let's|let us|imagine|picture this|ever wondered)/gim],
];
const strict = process.argv.includes('--strict');
const IGNORE_LINE = /^\s*(import |\/\/|#|url:|  - title:|title: ".*" *$)|https?:\/\//;
let hits = 0; const byRule = {};
function scan(p) {
  const st = statSync(p);
  if (st.isDirectory()) { for (const f of readdirSync(p)) scan(join(p, f)); return; }
  if (!['.md', '.mdx', '.astro', '.ts'].includes(extname(p))) return;
  const lines = readFileSync(p, 'utf8').split('\n');
  let inCode = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { inCode = !inCode; return; }
    if (inCode || IGNORE_LINE.test(line)) return;
    const text = line.replace(/`[^`]*`/g, '');
    for (const [name, re] of RULES) for (const m of text.matchAll(re)) {
      hits++; byRule[name] = (byRule[name] ?? 0) + 1;
      console.log(`${p}:${i + 1}  [${name}] "${m[0]}"  ${text.trim().slice(0, 110)}`);
    }
  });
}
for (const r of ROOTS) scan(r);
console.log(`\n${hits} finding(s).`, byRule);
process.exit(strict && hits ? 1 : 0);
