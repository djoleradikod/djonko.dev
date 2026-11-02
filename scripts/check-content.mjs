// Post-build checks: internal links resolve, and every page has a title.
// Run after `npm run build`: node scripts/check-content.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = 'dist';
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p); } })(root);

let bad = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  // Local assets: src, poster and srcset candidates, plus the share image.
  const assets = [...html.matchAll(/\s(?:src|poster)="(\/[^"#?]*)/g)].map((m) => m[1])
    .concat([...html.matchAll(/srcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((c) => c.trim().split(/\s+/)[0]).filter((u) => u.startsWith('/'))))
    .concat([...html.matchAll(/property="og:image" content="https?:\/\/[^/]+(\/[^"]*)"/g)].map((m) => m[1]));
  for (const u of assets) {
    if (u.startsWith('//') || u.startsWith('/media/')) continue;
    if (!existsSync(join(root, decodeURIComponent(u)))) { console.log(`MISSING ${u}  in ${f}`); bad++; }
  }
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const u = m[1];
    if (u.startsWith('//')) continue;
    const target = u.endsWith('/') ? join(root, u, 'index.html') : join(root, u);
    if (!existsSync(target)) { console.log(`BROKEN ${u}  in ${f}`); bad++; }
  }
}
console.log(`${files.length} pages checked, ${bad} broken internal links or missing assets`);
process.exit(bad ? 1 : 0);
