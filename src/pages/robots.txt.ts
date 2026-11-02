import type { APIRoute } from 'astro';
import { indexable } from '../data/site';

// Only a build for the production host is open to crawlers. See `indexable` in src/data/site.ts.
export const GET: APIRoute = ({ site }) => {
  const body = !indexable
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
