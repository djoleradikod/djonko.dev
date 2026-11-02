// Scans source and built output for personal or internal-only material before publishing.
// Usage: node scripts/privacy-scan.mjs [dir ...]   (defaults: src public dist)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src', 'public', 'dist'];
const exts = new Set(['.astro', '.mdx', '.md', '.ts', '.js', '.mjs', '.json', '.html', '.xml', '.css', '.svg', '.txt', '.csv', '.sh', '.ps1', '.py', '.yaml', '.yml', '.vtt']);
const skipDirs = new Set(['node_modules', '.git', 'pagefind', '_astro']);

const rules = [
  { name: 'proprietary marking', re: /proprietary|confidential|internal[ -]only|do not distribute/gi },
  { name: 'email address', re: /[A-Za-z0-9._%+-]+@(?!vsphere\.local\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    allow: m => /@(domain|example\.(com|org|net)|rainpole\.io)$/i.test(m) || /^(user|svc-li-vc-[^@]*|sso_user)@/i.test(m) },
  { name: 'IPv4 address', re: /\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g,
    allow: m => /^(198\.51\.100\.|127\.0\.0\.1|0\.0\.0\.0|172\.1[67]\.0\.0\/|198\.18\.0\.0\/|x\.x\.x\.x)/.test(m) || /^\d+\.\d+\.\d+\.\d+$/.test(m) && isVersionLike(m) },
  { name: 'internal hostname', re: /\b[a-z0-9-]+\.(?:corp|lan|intra|internal|home)\b/gi },
  { name: 'private names and terms', re: /\b(djole|tvucepinu|kucni|upskill|vsphere - jay)\b/gi },
];

function isVersionLike(s) {
  // Product versions such as 9.1.0.0100 or 8.0.3.24000 look like IPs; treat first octet <= 9 as a version.
  return Number(s.split('.')[0]) <= 9;
}

let hits = 0;
function scan(path) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const e of readdirSync(path)) if (!skipDirs.has(e)) scan(join(path, e));
    return;
  }
  if (!exts.has(extname(path))) return;
  if (path.endsWith('privacy-scan.mjs')) return;
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  for (const r of rules) {
    lines.forEach((line, i) => {
      for (const m of line.matchAll(r.re)) {
        if (r.allow && r.allow(m[0])) continue;
        hits++;
        console.log(`${path}:${i + 1}  [${r.name}]  ${m[0]}  ::  ${line.trim().slice(0, 140)}`);
      }
    });
  }
}
for (const r of roots) if (existsSync(r)) scan(r);
console.log(hits ? `\n${hits} finding(s). Review each before publishing.` : 'No findings.');
process.exit(hits ? 1 : 0);
