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
