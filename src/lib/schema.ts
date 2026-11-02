import { SITE, sameAs } from '../data/site';

// Person schema: the same name, photo and profile links everywhere helps search engines
// tie the site, LinkedIn and GitHub to one person.
export function personLd(site: URL | undefined) {
  const base = site ?? new URL('https://djonko.dev');
  const p: Record<string, unknown> = {
    '@context': 'https://schema.org', '@type': 'Person', '@id': new URL('/#person', base).href,
    name: SITE.author, jobTitle: SITE.role, url: base.href,
    knowsAbout: ['VMware Cloud Foundation', 'VCF Operations', 'vSphere', 'NSX', 'vSAN', 'Platform engineering'],
  };
  if (SITE.photo) p.image = new URL(SITE.photo, base).href;
  const links = sameAs();
  if (links.length) p.sameAs = links;
  return p;
}

export const personRef = (site: URL | undefined) => ({ '@id': new URL('/#person', site ?? 'https://djonko.dev').href, '@type': 'Person', name: SITE.author });
