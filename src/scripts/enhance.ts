// Progressive enhancements loaded on every page. Each one does nothing if its elements are absent.

// 1. Copy buttons: on every highlighted code block, and on any [data-copy] button.
function copyText(text: string, btn: HTMLElement) {
  navigator.clipboard?.writeText(text).then(() => {
    const was = btn.textContent;
    btn.textContent = 'Copied';
    btn.classList.add('done');
    setTimeout(() => { btn.textContent = was; btn.classList.remove('done'); }, 1600);
  });
}
document.querySelectorAll<HTMLPreElement>('pre.astro-code').forEach((pre) => {
  if (pre.closest('.dl-src') && pre.parentElement?.querySelector(':scope > .copy-btn')) return;
  const wrap = document.createElement('div');
  wrap.className = 'code-wrap';
  pre.replaceWith(wrap);
  wrap.append(pre);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'copy-btn code-copy'; btn.textContent = 'Copy';
  btn.setAttribute('aria-label', 'Copy code');
  btn.addEventListener('click', () => copyText(pre.innerText, btn));
  wrap.append(btn);
});
document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((b) =>
  b.addEventListener('click', () => copyText(b.dataset.copy!, b)));

// 2. Zoom viewer for images: anything with [data-zoom], plus plain images inside article prose.
const dialog = document.getElementById('zoom') as HTMLDialogElement | null;
if (dialog) {
  const img = dialog.querySelector('img')!;
  const cap = dialog.querySelector('figcaption')!;
  const open = (src: string, alt: string, caption: string) => {
    img.src = src; img.alt = alt; cap.textContent = caption; cap.hidden = !caption;
    dialog.showModal();
  };
  document.querySelectorAll<HTMLImageElement>('img[data-zoom], .prose p > img, .prose a:not([href]) > img').forEach((el) => {
    el.classList.add('zoomable');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Enlarge image: ${el.alt}`);
    const go = () => open(el.dataset.zoom || el.currentSrc || el.src, el.alt,
      el.dataset.caption || el.closest('figure')?.querySelector('figcaption')?.textContent || '');
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog || (e.target as HTMLElement).closest('.zoom-close')) dialog.close(); });
  dialog.addEventListener('close', () => { img.removeAttribute('src'); });
}

// 3. Mermaid diagrams: the library is only downloaded on pages that have one.
const diagrams = document.querySelectorAll<HTMLElement>('pre.mermaid');
if (diagrams.length) {
  diagrams.forEach((d) => { d.dataset.src = d.textContent ?? ''; });
  const isDark = () => document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  const render = async () => {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: isDark() ? 'dark' : 'neutral', fontFamily: getComputedStyle(document.body).fontFamily, flowchart: { useMaxWidth: true, htmlLabels: true, nodeSpacing: 30, rankSpacing: 36 } });
    diagrams.forEach((d) => { d.removeAttribute('data-processed'); d.textContent = d.dataset.src!; });
    await mermaid.run({ nodes: [...diagrams] });
  };
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); render(); }
  }, { rootMargin: '400px' });
  diagrams.forEach((d) => io.observe(d));
  new MutationObserver(() => { if (diagrams[0].dataset.processed) render(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// 4. Quick search: press / or Ctrl+K (Cmd+K on a Mac) anywhere, or the search icon. Uses the Pagefind
//    index directly, so results appear as you type without leaving the page. Without JavaScript, or
//    before the index exists (npm run dev), the icon and the form fall back to /search/.
type PfResult = { url: string; meta: { title?: string }; excerpt: string; sub_results?: { url: string; title: string; excerpt: string }[] };
const qs = document.getElementById('qs') as HTMLDialogElement | null;
if (qs) {
  const input = qs.querySelector<HTMLInputElement>('#qs-input')!;
  const list = qs.querySelector<HTMLUListElement>('#qs-list')!;
  const status = qs.querySelector<HTMLElement>('#qs-status')!;
  const all = qs.querySelector<HTMLAnchorElement>('#qs-all')!;
  let pf: { search: (q: string) => Promise<{ results: { score?: number; data: () => Promise<PfResult> }[] }>; options?: (o: object) => Promise<void> } | null = null;
  let failed = false, seq = 0, active = -1;

  const load = async () => {
    if (pf || failed) return pf;
    try {
      const url = '/pagefind/pagefind.js';
      pf = await import(/* @vite-ignore */ url);
      await pf!.options?.({ excerptLength: 18 });
    } catch { failed = true; }
    return pf;
  };
  const items = () => [...list.querySelectorAll<HTMLAnchorElement>('a[role="option"]')];
  const setActive = (i: number) => {
    const els = items(); if (!els.length) return;
    active = (i + els.length) % els.length;
    els.forEach((el, n) => el.setAttribute('aria-selected', String(n === active)));
    input.setAttribute('aria-activedescendant', els[active].id);
    els[active].scrollIntoView({ block: 'nearest' });
  };
  // Shorter queries built from an error message: drop tokens with digits, paths, addresses and IDs,
  // and common words. Returns groups to try in order: all the words, then runs of three neighbouring
  // words, then pairs (an error's key phrase is usually two or three words that belong together).
  const loosen = (q: string): string[][] => {
    const STOP = new Set(['error', 'failed', 'failure', 'could', 'unable', 'there', 'which', 'while', 'with', 'from', 'that', 'this', 'when', 'were', 'have', 'been', 'please', 'check', 'contact', 'returned', 'occurred']);
    const words = q.replace(/["'`()[\]{}<>,;]/g, ' ').split(/\s+/)
      .filter((w) => w.length >= 4 && !/[0-9\/\\@=:_]/.test(w) && !/\.[a-z]{2,}$/i.test(w))
      .map((w) => w.replace(/[.!?]+$/, '').toLowerCase()).filter((w) => w.length >= 4 && !STOP.has(w));
    const w = [...new Set(words)].slice(0, 8);
    const runs = (n: number) => w.length > n ? w.slice(0, w.length - n + 1).map((_, i) => w.slice(i, i + n).join(' ')) : [];
    return [[w.join(' ')], runs(3), runs(2)].filter((g) => g.length && g[0]);
  };
  const clean = (u: string) => u.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
  const section = (u: string) => u.split('/')[1] === 'vcf' ? (u.startsWith('/vcf/tools') ? 'Tools' : u.startsWith('/vcf/resources') ? 'Resources' : 'VCF notes')
    : u.startsWith('/blog') ? 'Blog' : u.startsWith('/projects') ? 'Projects' : 'Page';

  const run = async () => {
    const q = input.value.trim(); const mine = ++seq;
    all.href = q ? `/search/?q=${encodeURIComponent(q)}` : '/search/';
    if (!q) { list.replaceChildren(); input.setAttribute('aria-expanded', 'false'); status.textContent = 'Type to search. Arrow keys move, Enter opens.'; return; }
    const p = await load();
    if (!p) { status.textContent = 'Quick search is not available here. Press Enter for the search page.'; return; }
    // A pasted error message rarely matches word for word: it carries host names, IDs and paths.
    // When the full text finds nothing, search again on its distinctive words.
    let res = await p.search(q), used = '';
    if (!res.results.length && q.split(/\s+/).length > 3) {
      // Try every candidate and keep the one whose best page scores highest: a run of words that
      // appears together in a heading or summary beats words scattered across a long page.
      let top = 0;
      for (const alt of loosen(q).flat()) {
        const r = await p.search(alt); const sc = r.results[0]?.score ?? 0;
        if (sc > top) { top = sc; res = r; used = alt; }
      }
    }
    const pages = await Promise.all(res.results.slice(0, 8).map((r) => r.data()));
    if (mine !== seq) return;
    // One row per matching section, up to three per page, so a page like the tools catalogue can
    // return several tools for one query. Pages without a matching section get one row.
    type Row = { url: string; title: string; section?: string; excerpt: string; kind: string };
    const rows: Row[] = [];
    for (const r of pages) {
      const title = r.meta.title ?? r.url;
      const subs = (r.sub_results ?? []).filter((x) => x.url.includes('#') && x.excerpt.includes('<mark>')).slice(0, 3);
      if (subs.length) subs.forEach((x) => rows.push({ url: clean(x.url), title, section: x.title !== title ? x.title : undefined, excerpt: x.excerpt, kind: section(r.url) }));
      else rows.push({ url: clean(r.url), title, excerpt: r.excerpt, kind: section(r.url) });
    }
    // A bare KB number also offers the article itself, first.
    const kb = q.replace(/^kb\s*/i, '').match(/^\d{5,7}$/)?.[0];
    if (kb) rows.unshift({ url: `https://knowledge.broadcom.com/external/article/${kb}`, title: `Open KB ${kb}`, excerpt: 'Broadcom knowledge base, opens the public article', kind: 'Broadcom KB' });
    const top = rows.slice(0, 10);
    list.replaceChildren(...top.map((r, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = r.url; a.id = `qs-o${i}`; a.setAttribute('role', 'option'); a.setAttribute('aria-selected', 'false');
      const t = document.createElement('span'); t.className = 'qs-t'; t.textContent = r.title;
      if (r.section) { const s = document.createElement('span'); s.className = 'qs-s'; s.textContent = `§ ${r.section}`; t.append(' ', s); }
      const k = document.createElement('span'); k.className = 'qs-k'; k.textContent = r.kind;
      const e = document.createElement('span'); e.className = 'qs-e';
      // Pagefind excerpts contain only text and <mark>; rebuild them as nodes rather than trusting HTML.
      r.excerpt.split(/(<mark>.*?<\/mark>)/).forEach((part) => {
        const m = part.match(/^<mark>(.*)<\/mark>$/);
        if (m) { const mk = document.createElement('mark'); mk.textContent = m[1]; e.append(mk); } else e.append(part.replace(/<[^>]+>/g, ''));
      });
      a.append(k, t, e); li.append(a); return li;
    }));
    input.setAttribute('aria-expanded', String(top.length > 0));
    const n = res.results.length;
    status.textContent = top.length ? (used ? `No page has the whole text. ${n} match "${used}".` : `${n} page${n === 1 ? '' : 's'} match`) : 'No results. Try fewer words or a KB number.';
    active = -1; if (top.length) setActive(0);
  };
  let timer = 0;
  input.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(run, 120); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter' && active >= 0 && items()[active]) { e.preventDefault(); location.href = items()[active].href; }
  });
  const open = (text?: string) => {
    if (text !== undefined) { input.value = text; }
    if (!qs.open) { qs.showModal(); load(); }
    if (text !== undefined) { input.focus(); input.setSelectionRange(text.length, text.length); run(); } else input.select();
  };
  // Search boxes in a page (home, VCF hub) work as a form to /search/ without JavaScript. With it,
  // typing or clicking in one opens quick search and carries the text over.
  document.querySelectorAll<HTMLInputElement>('input[data-qs-trigger]').forEach((box) => {
    box.addEventListener('input', () => { const v = box.value; box.value = ''; open(v); });
    box.addEventListener('click', () => open(box.value));
    box.form?.addEventListener('submit', (e) => { e.preventDefault(); open(box.value); });
  });
  document.getElementById('qs-open')?.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); open();
  });
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault(); open();
    }
  });
  qs.addEventListener('click', (e) => { if (e.target === qs || (e.target as HTMLElement).closest('[data-qs-close]')) qs.close(); });
}

// 5. Section links: every h2 and h3 with an id inside prose gets a link that also copies its URL.
document.querySelectorAll<HTMLHeadingElement>('.prose h2[id], .prose h3[id]').forEach((h) => {
  const a = document.createElement('a');
  a.className = 'anchor'; a.href = `#${h.id}`; a.textContent = '#';
  a.setAttribute('aria-label', `Link to section: ${h.textContent}`);
  a.addEventListener('click', () => { navigator.clipboard?.writeText(new URL(`#${h.id}`, location.href).href).catch(() => {}); });
  h.append(' ', a);
});

// 6. "On this page": highlight the section being read.
const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]')];
if (tocLinks.length) {
  const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const heads = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  let queued = false, last: HTMLAnchorElement | undefined;
  const mark = () => {
    queued = false;
    // The current section is the last heading that has scrolled above the upper third of the window.
    const line = innerHeight * 0.3;
    const current = byId.get((heads.filter((h) => h.getBoundingClientRect().top < line).at(-1) ?? heads[0]).id);
    if (current === last) return;
    last?.removeAttribute('aria-current'); current?.setAttribute('aria-current', 'location'); last = current;
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(mark); } }, { passive: true });
  mark();
}

// 7. Reading progress, kept only in this browser. A note counts as read once its end has been on
//    screen. Path pages show which steps are done and link to the first unread one.
const READ_KEY = 'djonko:read';
const readSet = (): Set<string> => { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); } };
const saveRead = (s: Set<string>) => { try { localStorage.setItem(READ_KEY, JSON.stringify([...s])); } catch { /* private mode: progress is not kept */ } };

const note = document.querySelector<HTMLElement>('article[data-note]');
const end = note?.querySelector('.note-end');
if (note && end && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const s = readSet(); s.add(note.dataset.note!); saveRead(s);
  });
  io.observe(end);
}

const steps = document.querySelector<HTMLOListElement>('ol.path-steps');
if (steps) {
  const go = document.getElementById('path-go') as HTMLAnchorElement;
  const status = document.getElementById('path-status')!;
  const reset = document.getElementById('path-reset') as HTMLButtonElement;
  const items = [...steps.querySelectorAll<HTMLLIElement>('li[data-note]')];
  const paint = () => {
    const s = readSet();
    items.forEach((li) => { const done = s.has(li.dataset.note!); li.classList.toggle('done', done); li.querySelector<HTMLElement>('.done-label')!.hidden = !done; });
    const n = items.filter((li) => li.classList.contains('done')).length;
    const next = items.findIndex((li) => !li.classList.contains('done'));
    reset.hidden = n === 0;
    status.textContent = n ? `${n} of ${items.length} read` : '';
    if (n === items.length) { go.textContent = 'Path complete: start again'; go.href = items[0].querySelector('a')!.href; }
    else if (n) { go.textContent = `Continue with step ${next + 1}`; go.href = items[next].querySelector('a')!.href; }
  };
  reset.addEventListener('click', () => { const s = readSet(); items.forEach((li) => s.delete(li.dataset.note!)); saveRead(s); go.textContent = 'Start with step 1'; go.href = items[0].querySelector('a')!.href; paint(); });
  paint();
}
document.querySelectorAll<HTMLElement>('[data-path-steps]').forEach((card) => {
  const ids = card.dataset.pathSteps!.split(' '); const s = readSet();
  const n = ids.filter((id) => s.has(id)).length;
  const out = card.querySelector<HTMLElement>('.path-progress');
  if (out && n) { out.textContent = n === ids.length ? '· Complete' : `· ${n} of ${ids.length} read`; out.hidden = false; }
});

// 8. Offline reading: a service worker keeps every page opened here, so it opens again without a
//    connection (see public/sw.js and /offline/). Buttons with [data-offline-save] save a list of
//    pages ahead of time and report progress in the [data-offline-status] element next to them.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
  document.querySelectorAll<HTMLButtonElement>('[data-offline-save]').forEach((btn) => {
    const status = btn.parentElement?.querySelector<HTMLElement>('[data-offline-status]');
    btn.addEventListener('click', async () => {
      const urls = JSON.parse(btn.dataset.offlineSave!) as string[];
      btn.disabled = true;
      if (status) status.textContent = 'Preparing…';
      navigator.storage?.persist?.().catch(() => {});
      const reg = await navigator.serviceWorker.ready;
      const onMsg = (e: MessageEvent) => {
        const d = e.data || {};
        if (d.type !== 'save-progress' || d.total !== urls.length) return;
        if (status) status.textContent = `Saved ${d.done} of ${d.total}${d.failed ? `, ${d.failed} failed` : ''}`;
        if (d.done + d.failed === d.total) {
          navigator.serviceWorker.removeEventListener('message', onMsg);
          btn.disabled = false;
          if (status && !d.failed) status.textContent = `Saved ${d.total} pages. They open without a connection.`;
          document.dispatchEvent(new CustomEvent('offline-saved'));
        }
      };
      navigator.serviceWorker.addEventListener('message', onMsg);
      reg.active?.postMessage({ type: 'save', urls });
    });
  });
} else {
  document.querySelectorAll<HTMLButtonElement>('[data-offline-save]').forEach((btn) => { btn.disabled = true; });
}
