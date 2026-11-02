import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { SITE } from '../data/site';

export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;
export type ProjectMeta = CollectionEntry<'projectMeta'>['data'];
const show = (e: { data: { draft: boolean } }) => import.meta.env.DEV || !e.data.draft;

export const slugOf = (e: { id: string }) => e.id.split('/').pop()!;
export const postUrl = (p: Post) => `/blog/${slugOf(p)}/`;
export const projectUrl = (p: Project) => `/projects/${slugOf(p)}/`;
export const tagSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function allPosts(): Promise<Post[]> {
  return (await getCollection('posts', show)).sort((a, b) => +b.data.pubDate - +a.data.pubDate);
}
export async function allProjects(): Promise<Project[]> {
  return (await getCollection('projects', show)).sort((a, b) => a.data.order - b.data.order || a.data.displayName.localeCompare(b.data.displayName));
}

/** Facts from the release project.json, if a release exists; otherwise undefined. */
export async function projectMeta(p: Project): Promise<ProjectMeta | undefined> {
  return (await getEntry('projectMeta', slugOf(p)))?.data;
}
export const repoOf = (p: Project) => p.data.repo ?? `${SITE.githubOwner}/${slugOf(p)}-for-vcf-operations`;

export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** Minutes to read, from the raw Markdown body, ignoring code blocks and component markup. */
export function readingTime(body = ''): number {
  const text = body.replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').replace(/[#*_`>\-|[\]()]/g, ' ');
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220));
}

/** Posts sharing the most tags with this one. */
export function related(p: Post, all: Post[], n = 3): Post[] {
  const tags = new Set(p.data.tags);
  return all.filter((x) => x.id !== p.id)
    .map((x) => ({ x, score: x.data.tags.filter((t) => tags.has(t)).length + (x.data.series && x.data.series === p.data.series ? 2 : 0) }))
    .filter((r) => r.score > 0).sort((a, b) => b.score - a.score || +b.x.data.pubDate - +a.x.data.pubDate)
    .slice(0, n).map((r) => r.x);
}
