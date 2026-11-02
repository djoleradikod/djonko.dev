import { PATHS, type ReadingPath } from '../data/paths';
import { allArticles, type Article } from './articles';
import { readingTime } from './posts';

export type ResolvedPath = ReadingPath & { notes: Article[]; minutes: number };

let cache: ResolvedPath[] | undefined;
/** Paths with their notes in order. Throws at build time if a step names a note that does not exist. */
export async function readingPaths(): Promise<ResolvedPath[]> {
  if (cache) return cache;
  const items = await allArticles();
  cache = PATHS.map((p) => {
    const notes = p.steps.map((id) => {
      const a = items.find((x) => x.id === id);
      if (!a) throw new Error(`Reading path "${p.id}" names "${id}", which is not a published note.`);
      return a;
    });
    return { ...p, notes, minutes: notes.reduce((n, a) => n + readingTime(a.body), 0) };
  });
  return cache;
}

/** The paths a note belongs to, with its position in each. */
export async function pathsFor(id: string) {
  return (await readingPaths()).flatMap((p) => {
    const i = p.steps.indexOf(id);
    return i < 0 ? [] : [{ path: p, index: i, prev: p.notes[i - 1], next: p.notes[i + 1] }];
  });
}
