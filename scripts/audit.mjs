// Post-build audit in a real browser (Chromium via Playwright):
//  - axe-core accessibility rules (WCAG 2.2 AA) on every page, light and dark on a sample
//  - Content Security Policy violations and console errors
//  - broken images and media on the page
//  - page weight budget: HTML + CSS + JS transferred on first load
// Usage: npm run audit            (after npm run build)
//        AUDIT_ALL_DARK=1 npm run audit   to check dark mode on every page
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const ROOT = 'dist';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.xml': 'application/xml', '.pdf': 'application/pdf', '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  let f = join(ROOT, p);
  if (p.startsWith('/media/')) f = join('media', p.slice(7));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(readFileSync(join(ROOT, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream', 'X-Frame-Options': 'SAMEORIGIN' });
  res.end(readFileSync(f));
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!['_astro', 'pagefind', 'og'].includes(f)) walk(p); } else if (f === 'index.html') pages.push('/' + d.slice(ROOT.length + 1).replace(/\\/g, '/') + (d === ROOT ? '' : '/')); } })(ROOT);
pages.sort();
const darkSample = new Set(['/', '/vcf/', '/blog/', '/projects/', '/contact/', pages.find((p) => p.startsWith('/vcf/library/troubleshooting/') && p.split('/').length > 5)]);
const BUDGET_KB = Number(process.env.AUDIT_BUDGET_KB ?? 350);

// Use Playwright's own browser; if it is not installed for this exact version, fall back to
// CHROMIUM_PATH or a system Chromium, so a Playwright update does not break local runs.
const browser = await chromium.launch().catch(async (e) => {
  const { existsSync } = await import('node:fs');
  const path = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium', '/usr/bin/chromium'].find((p) => p && existsSync(p));
  if (!path) throw e;
  return chromium.launch({ executablePath: path });
});
const problems = [];
const weights = [];
for (const path of pages) {
  for (const scheme of ['light', 'dark']) {
    if (scheme === 'dark' && !process.env.AUDIT_ALL_DARK && !darkSample.has(path)) continue;
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    let bytes = 0;
    let loaded = false; // responses after DOMContentLoaded are lazy (e.g. the diagram library) and do not count
    page.once('domcontentloaded', () => { loaded = true; });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', async (r) => {
      const t = r.headers()['content-type'] ?? '';
      if (!loaded && /html|css|javascript/.test(t)) { try { bytes += (await r.body()).length; } catch {} }
      if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`HTTP ${r.status()} ${r.url().replace(base, '')}`);
    });
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, rules: { region: { enabled: false } } })).violations
      .filter((v) => ['serious', 'critical'].includes(v.impact))
      .map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })));
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src));
    for (const v of result) problems.push(`${path} [${scheme}] a11y ${v.id}: ${v.help} -> ${v.nodes.join(' | ')}`);
    for (const e of errors.filter((e) => !/youtube|vimeo|cloudflareinsights|plausible/.test(e))) problems.push(`${path} [${scheme}] console: ${e}`);
    for (const b of broken) problems.push(`${path} [${scheme}] broken image: ${b}`);
    if (scheme === 'light') weights.push([path, Math.round(bytes / 1024)]);
    await ctx.close();
  }
}
await browser.close();
server.close();

weights.sort((a, b) => b[1] - a[1]);
const over = weights.filter(([, kb]) => kb > BUDGET_KB);
console.log(`Audited ${pages.length} pages (dark mode on ${process.env.AUDIT_ALL_DARK ? pages.length : [...darkSample].filter(Boolean).length}).`);
console.log(`Heaviest first loads (HTML+CSS+JS, uncompressed): ${weights.slice(0, 5).map(([p, kb]) => `${p} ${kb} KB`).join(', ')}`);
for (const [p, kb] of over) problems.push(`${p} page weight ${kb} KB is over the ${BUDGET_KB} KB budget`);
if (problems.length) { console.log(`\n${problems.length} problem(s):\n` + problems.map((p) => '  ' + p).join('\n')); process.exit(1); }
console.log('No accessibility, CSP, console, image or weight problems.');
