// Fetches each tool's release project.json into src/data/projects/<slug>.json.
// Run before a build: npm run sync:projects. A missing release (404) or no network keeps the cached copy.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import yaml from 'js-yaml';

const SRC = 'src/content/projects';
const OUT = 'src/data/projects';
const site = readFileSync('src/data/site.ts', 'utf8');
const owner = process.env.GITHUB_OWNER || /githubOwner:\s*'([^']+)'/.exec(site)?.[1];
mkdirSync(OUT, { recursive: true });

let ok = 0, kept = 0, missing = 0;
for (const f of readdirSync(SRC).filter((f) => /\.mdx?$/.test(f))) {
  const slug = basename(f, extname(f));
  const fm = yaml.load(/^---\n([\s\S]*?)\n---/.exec(readFileSync(join(SRC, f), 'utf8'))?.[1] ?? '') ?? {};
  if (fm.draft) continue;
  const repo = fm.repo || `${owner}/${slug}-for-vcf-operations`;
  const url = `https://github.com/${repo}/releases/latest/download/project.json`;
  const out = join(OUT, `${slug}.json`);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.schema !== 1) throw new Error(`unsupported schema ${data.schema}`);
    if (data.slug !== slug) console.warn(`  note: ${repo} reports slug "${data.slug}", page is "${slug}"`);
    writeFileSync(out, JSON.stringify({ ...data, fetchedAt: new Date().toISOString() }, null, 2) + '\n');
    console.log(`updated  ${slug}  v${data.version}  (${repo})`); ok++;
  } catch (e) {
    if (existsSync(out)) { console.log(`kept     ${slug}  cached copy (${e.message})`); kept++; }
    else { console.log(`pending  ${slug}  no release yet (${e.message}); page uses its own front matter`); missing++; }
  }
}
console.log(`\n${ok} updated, ${kept} kept from cache, ${missing} without a release.`);
