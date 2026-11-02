// Prints selected pages to PDF with Chromium, into public/downloads so the next build publishes them
// with size and checksum. Run after a build when the source pages change:
//   npm run build && npm run pdfs && npm run build
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { CV_PUBLISHED } from './cv-flag.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const JOBS = [
  { path: '/vcf/resources/triage-cheat-sheet/', out: 'public/downloads/vcf/vcf9-triage-cheat-sheet.pdf', title: 'VCF 9.x triage cheat sheet' },
  ...(CV_PUBLISHED ? [{ path: '/cv/', out: 'public/downloads/jay-djonko-cv.pdf', title: 'Jay Djonko CV', bare: true }] : []),
];

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let f = join('dist', normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
for (const job of JOBS) {
  const page = await browser.newPage({ colorScheme: 'light' });
  await page.goto(base + job.path, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  mkdirSync(dirname(job.out), { recursive: true });
  await page.pdf({
    path: job.out, format: 'A4', printBackground: true, preferCSSPageSize: !!job.bare,
    margin: job.bare ? undefined : { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
    displayHeaderFooter: !job.bare,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font:8px system-ui,sans-serif;color:#666;width:100%;padding:0 12mm;display:flex;justify-content:space-between"><span>${job.title} · djonko.dev${job.path}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  });
  console.log(`wrote ${job.out} (${(statSync(job.out).size / 1024).toFixed(0)} KB)`);
  await page.close();
}
await browser.close();
server.close();
