// Offline reading for djonko.dev.
//
// Pages: network first, so a reader online always gets the current page; the copy is kept, so the
// same page opens without a connection later. Hashed build files (/_astro/, Pagefind index parts):
// cache first, because their names change whenever their content does. A page that was never saved
// falls back to /offline/, which lists what is available.
//
// To switch offline reading off for everyone, replace this file with one that calls
// self.registration.unregister() and deletes the caches, and deploy. Browsers check this file on
// every visit (it is served with Cache-Control: no-cache).
const CACHE = 'djonko-offline-v1';
const OFFLINE = '/offline/';
const MAX_ENTRIES = 600;
const hashed = (p) => p.startsWith('/_astro/') || /_[0-9a-f]{6,}\.[a-z_]+$/i.test(p) || p.startsWith('/pagefind/fragment/') || p.startsWith('/pagefind/index/');

// Fetch a page, keep it, and keep the stylesheets, scripts and images it needs, so it looks right offline.
async function saveWithDeps(c, url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok || res.type !== 'basic') throw new Error(`${url}: ${res.status}`);
  await c.put(url, res.clone());
  const html = await res.text();
  const deps = new Set([...html.matchAll(/(?:href|src)="(\/(?:_astro|img|fonts)\/[^"]+)"/g)].map((m) => m[1]));
  for (const dep of deps) if (!(await c.match(dep))) { try { await c.add(dep); } catch {} }
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(async (c) => { await saveWithDeps(c, OFFLINE); try { await saveWithDeps(c, '/'); } catch {} }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('djonko-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Keep the cache bounded. Oldest entries go first; the offline page and the home page stay.
async function trim(c) {
  const keys = (await c.keys()).filter((k) => !['/', OFFLINE].includes(new URL(k.url).pathname));
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) await c.delete(k);
}

async function networkFirst(req, isPage) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') { await c.put(req, res.clone()); trim(c); }
    return res;
  } catch (err) {
    const hit = await c.match(req, { ignoreSearch: isPage });
    if (hit) return hit;
    if (isPage) return (await c.match(OFFLINE)) ?? Response.error();
    throw err;
  }
}

async function cacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') c.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Video, large downloads and partial requests go straight to the network.
  if (req.headers.has('range') || url.pathname.startsWith('/media/') || url.pathname === '/sw.js') return;
  if (req.mode === 'navigate') return e.respondWith(networkFirst(req, true));
  if (hashed(url.pathname)) return e.respondWith(cacheFirst(req));
  e.respondWith(networkFirst(req, false));
});

// The page can ask for a list of addresses to be saved ("Save this path for offline").
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type !== 'save' || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    let done = 0, failed = 0;
    for (const u of d.urls) {
      try { await saveWithDeps(c, u); done++; } catch { failed++; }
      e.source?.postMessage({ type: 'save-progress', done, failed, total: d.urls.length });
    }
    await trim(c);
  })());
});
