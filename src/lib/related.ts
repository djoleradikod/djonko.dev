import { allArticles, type Article } from './articles';
import { readingPaths } from './paths';

/** Every KB number a note refers to: the front matter list, <KB id={n} /> tags and plain KB links in the body. */
export function kbsOf(a: Article): number[] {
  const body = a.body ?? '';
  const found = [
    ...a.data.kbs,
    ...[...body.matchAll(/<KB\s+id=\{(\d+)\}/g)].map((m) => Number(m[1])),
    ...[...body.matchAll(/knowledge\.broadcom\.com\/external\/article\/(\d+)/g)].map((m) => Number(m[1])),
  ];
  return [...new Set(found)];
}

let citeCache: Map<number, Article[]> | undefined;
/** KB number -> the notes that cite it, in library order. */
export async function kbCitations(): Promise<Map<number, Article[]>> {
  if (citeCache) return citeCache;
  const m = new Map<number, Article[]>();
  for (const a of await allArticles()) for (const k of kbsOf(a)) m.set(k, [...(m.get(k) ?? []), a]);
  return (citeCache = m);
}

const STOP = new Set('about after also and before between both does each from have into more only over than that their them then there these they this what when where which while with without your vcf 9.x 5.x'.split(' '));
const words = (a: Article) => new Set(`${a.data.title} ${a.data.description}`.toLowerCase().match(/[a-z][a-z0-9.-]{3,}/g)?.filter((w) => !STOP.has(w)) ?? []);

/**
 * Up to `n` notes worth reading after this one. Shared KBs count most (the notes deal with the same
 * problem), then a shared reading path, then shared words in the title and summary, then the category.
 * Notes already linked as previous and next are left out.
 */
export async function relatedNotes(a: Article, exclude: (Article | undefined)[] = [], n = 3): Promise<Article[]> {
  const items = await allArticles();
  const paths = await readingPaths();
  const mine = new Set(kbsOf(a));
  const myPaths = new Set(paths.filter((p) => p.steps.includes(a.id)).map((p) => p.id));
  const myWords = words(a);
  const skip = new Set([a.id, ...exclude.filter(Boolean).map((x) => x!.id)]);
  return items
    .filter((x) => !skip.has(x.id))
    .map((x) => {
      const kb = kbsOf(x).filter((k) => mine.has(k)).length;
      const path = paths.some((p) => myPaths.has(p.id) && p.steps.includes(x.id)) ? 1 : 0;
      const w = [...words(x)].filter((t) => myWords.has(t)).length;
      return { x, score: 3 * Math.min(kb, 3) + 2 * path + Math.min(w, 4) + (x.data.category === a.data.category ? 1 : 0) };
    })
    .filter((r) => r.score >= 3)
    .sort((p, q) => q.score - p.score || p.x.data.order - q.x.data.order)
    .slice(0, n)
    .map((r) => r.x);
}
