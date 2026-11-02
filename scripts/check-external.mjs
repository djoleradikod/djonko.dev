#!/usr/bin/env node
// Check every external link in the built site (dist/) still resolves.
// Run after `npm run build`: `npm run check:external`. CI runs it weekly.
//
// Result per URL:
//   ok       2xx or 3xx after redirects
//   blocked  401, 403, 429 or a bot challenge: the server is up but refuses automated requests.
//            Reported, not failed, because several vendor sites (including the Broadcom KB portal)
//            answer scripted requests this way.
//   broken   404, 410, other 4xx, 5xx after one retry, DNS failure or timeout. Fails the run.
//
// Options: CONCURRENCY (default 6), TIMEOUT_MS (default 20000), ONLY=<substring> to check a subset.
import { readdir, readFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const TIMEOUT = Number(process.env.TIMEOUT_MS || 20000);
const ONLY = process.env.ONLY || '';
const UA = 'Mozilla/5.0 (compatible; djonko-dev-linkcheck/1.0; +https://djonko.dev/)';
const OWN = /^https?:\/\/([a-z0-9-]+\.)*(djonko\.dev|djonko-dev\.pages\.dev)(\/|$)/i;
// Links that are not meant to be fetched (share intents, mail, schema vocabularies).
const SKIP = [/^https:\/\/(www\.)?linkedin\.com\/sharing\//, /^https:\/\/schema\.org\//, /^https:\/\/www\.youtube-nocookie\.com\/embed\//, /^https:\/\/player\.vimeo\.com\//];

async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"');
const links = new Map(); // url -> Set(pages)
for await (const file of htmlFiles(DIST)) {
  const html = await readFile(file, 'utf8');
  const page = '/' + file.slice(DIST.length + 1).replace(/index\.html$/, '');
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"#]+)(#[^"]*)?"/gi)) {
    const url = decode(m[1]);
    if (OWN.test(url) || SKIP.some((r) => r.test(url)) || (ONLY && !url.includes(ONLY))) continue;
    if (!links.has(url)) links.set(url, new Set());
    links.get(url).add(page);
  }
}

async function request(url, method) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } });
    const challenge = r.headers.get('cf-mitigated') === 'challenge';
    if (method === 'GET') await r.body?.cancel();
    return { status: r.status, challenge };
  } catch (e) {
    return { status: 0, error: e.name === 'AbortError' ? 'timeout' : (e.cause?.code || e.message) };
  } finally { clearTimeout(t); }
}

async function check(url) {
  let r = await request(url, 'HEAD');
  // Many servers mishandle HEAD; confirm anything that is not a clear success with GET.
  if (r.status === 0 || r.status >= 400) r = await request(url, 'GET');
  if ((r.status === 0 || r.status >= 500) && !r.challenge) { await new Promise((s) => setTimeout(s, 3000)); r = await request(url, 'GET'); }
  const state = r.challenge || [401, 403, 429].includes(r.status) ? 'blocked'
    : r.status >= 200 && r.status < 400 ? 'ok' : 'broken';
  return { url, state, detail: r.error || String(r.status) };
}

const queue = [...links.keys()];
const results = [];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) results.push(await check(queue.shift()));
}));

const by = (s) => results.filter((r) => r.state === s).sort((a, b) => a.url.localeCompare(b.url));
const broken = by('broken'), blocked = by('blocked');
const where = (u) => [...links.get(u)].slice(0, 3).join(', ') + (links.get(u).size > 3 ? ` and ${links.get(u).size - 3} more` : '');

console.log(`${results.length} external links: ${by('ok').length} ok, ${blocked.length} blocked automated requests, ${broken.length} broken`);
for (const r of broken) console.log(`BROKEN   ${r.detail.padEnd(9)} ${r.url}\n         on ${where(r.url)}`);
for (const r of blocked) console.log(`blocked  ${r.detail.padEnd(9)} ${r.url}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = (list) => list.map((r) => `| ${r.detail} | ${r.url} | ${where(r.url)} |`).join('\n');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, [
    `### External links`, ``,
    `${results.length} checked: ${by('ok').length} ok, ${blocked.length} blocked automated requests, ${broken.length} broken.`, ``,
    broken.length ? `#### Broken\n\n| Result | URL | Linked from |\n|---|---|---|\n${rows(broken)}\n` : '',
    blocked.length ? `<details><summary>Blocked automated requests (${blocked.length}), check by hand if in doubt</summary>\n\n| Result | URL | Linked from |\n|---|---|---|\n${rows(blocked)}\n\n</details>\n` : '',
  ].join('\n'));
}
process.exit(broken.length ? 1 : 0);
