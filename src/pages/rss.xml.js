import rss from '@astrojs/rss';
import { SITE } from '../data/site';
import { allArticles, urlOf } from '../lib/articles';
import { allPosts, postUrl } from '../lib/posts';

export async function GET(context) {
  const notes = (await allArticles()).map((a) => ({
    title: a.data.title, description: a.data.description, pubDate: a.data.updated ?? a.data.pubDate, link: urlOf(a),
    categories: ['VCF notes', a.data.category, ...a.data.versions.map((v) => `VCF ${v}`)],
  }));
  const posts = (await allPosts()).map((p) => ({
    title: p.data.title, description: p.data.description, pubDate: p.data.updated ?? p.data.pubDate, link: postUrl(p),
    categories: ['Blog', ...p.data.tags],
  }));
  return rss({
    title: SITE.name,
    description: SITE.tagline,
    site: context.site,
    items: [...posts, ...notes].sort((a, b) => +b.pubDate - +a.pubDate),
  });
}
