import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard, type Card } from '../../lib/og';
import { SITE } from '../../data/site';
import { CATEGORIES, categoryById } from '../../data/categories';
import { allArticles, urlOf } from '../../lib/articles';
import { readingPaths } from '../../lib/paths';
import { allPosts, allProjects, postUrl, projectUrl, tagSlug } from '../../lib/posts';

// One share image per indexable page: /og/<page path>.png ("/" is /og/index.png).
const slugFor = (path: string) => (path === '/' ? 'index' : path.replace(/^\/|\/$/g, ''));

export const getStaticPaths: GetStaticPaths = async () => {
  const pages: [string, Card][] = [
    ['/', { title: 'I help teams design, upgrade and run VMware Cloud Foundation.', eyebrow: `${SITE.author} · ${SITE.role}` }],
    ['/about/', { title: 'How I work: evidence, method and clear explanations', eyebrow: 'About' }],
    ['/contact/', { title: `Get in touch with ${SITE.author}`, eyebrow: 'Contact' }],
    ['/talks/', { title: 'A five-part VCF 9 workshop series', eyebrow: 'Talks and workshops' }],
    ['/cv/', { title: `${SITE.author}, ${SITE.role}`, eyebrow: 'CV' }],
    ['/vcf/', { title: 'Field notes for running VMware Cloud Foundation, 5.x and 9.x', eyebrow: SITE.vcfName, versions: ['5.x', '9.0', '9.1'] }],
    ['/vcf/library/', { title: 'The VCF notes library', eyebrow: SITE.vcfName }],
    ['/vcf/resources/', { title: 'Tools, KB index, triage cheat sheet and glossary', eyebrow: `${SITE.vcfName} · Resources` }],
    ['/vcf/tools/', { title: 'Tools for VCF 9.x: official, Fling and community', eyebrow: `${SITE.vcfName} · Tools`, versions: ['9.0', '9.1'] }],
    ['/vcf/resources/kb-index/', { title: 'Broadcom KB index for VCF 9', eyebrow: `${SITE.vcfName} · Resources` }],
    ['/vcf/resources/triage-cheat-sheet/', { title: 'VCF 9.x triage cheat sheet', eyebrow: `${SITE.vcfName} · Resources`, versions: ['9.0', '9.1'] }],
    ['/vcf/resources/glossary/', { title: 'VCF 5.x to 9.x glossary', eyebrow: `${SITE.vcfName} · Resources`, versions: ['5.x', '9.0', '9.1'] }],
    ['/vcf/resources/how-notes-are-checked/', { title: 'How these notes are checked', eyebrow: `${SITE.vcfName} · Resources` }],
    ['/blog/', { title: 'Write-ups, case studies and walkthroughs', eyebrow: 'Blog' }],
    ['/projects/', { title: 'Open tools for VCF Operations 9.1.1+', eyebrow: 'Projects' }],
  ];
  pages.push(['/vcf/paths/', { title: 'Reading paths through the VCF notes', eyebrow: `${SITE.vcfName} · Paths` }]);
  for (const p of await readingPaths()) pages.push([`/vcf/paths/${p.id}/`, { title: p.title, eyebrow: `${SITE.vcfName} · Reading path · ${p.notes.length} notes` }]);
  for (const c of CATEGORIES) pages.push([`/vcf/library/${c.id}/`, { title: c.title, eyebrow: SITE.vcfName }]);
  for (const a of await allArticles()) pages.push([urlOf(a), { title: a.data.title, eyebrow: `${SITE.vcfName} · ${categoryById(a.data.category).short}`, versions: a.data.versions }]);
  const posts = await allPosts();
  for (const p of posts) pages.push([postUrl(p), { title: p.data.title, eyebrow: `Blog · ${p.data.kind}` }]);
  for (const t of new Set(posts.flatMap((p) => p.data.tags))) pages.push([`/blog/tags/${tagSlug(t)}/`, { title: t, eyebrow: 'Blog · Tag' }]);
  for (const p of await allProjects()) pages.push([projectUrl(p), { title: p.data.displayName, eyebrow: 'Projects' }]);
  return pages.map(([path, card]) => ({ params: { slug: slugFor(path) }, props: card }));
};

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderCard(props as Card), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
