import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;
export const slugOf = (a: Article) => a.id.split('/').pop()!;
export const urlOf = (a: Article) => `/vcf/library/${a.data.category}/${slugOf(a)}/`;

export async function allArticles(): Promise<Article[]> {
  const items = await getCollection('articles', (a) => import.meta.env.DEV || !a.data.draft);
  return items.sort((a, b) => a.data.category.localeCompare(b.data.category) || a.data.order - b.data.order);
}
