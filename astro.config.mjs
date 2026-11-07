import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import remarkMermaid from './src/lib/remark-mermaid.mjs';
import rehypeTableWrap from './src/lib/rehype-table-wrap.mjs';

// Pages that should not appear in the sitemap.
const HIDDEN = /\/(404|search|cv|guide)\/?$/;

// In `npm run dev`, serve ./media at /media so videos and large files work locally.
// In production the web server (Caddy on Hetzner) or a separate media origin serves them.
const TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.zip': 'application/zip' };
const devMedia = {
  name: 'dev-media',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/media', (req, res, next) => {
        const file = normalize(join(process.cwd(), 'media', decodeURIComponent((req.url || '/').split('?')[0])));
        if (!file.startsWith(join(process.cwd(), 'media')) || !existsSync(file) || statSync(file).isDirectory()) return next();
        res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
  },
};

export default defineConfig({
  site: process.env.SITE_URL
    // Cloudflare Pages preview branches get their own URL so canonicals and the sitemap match.
    || (process.env.CF_PAGES && process.env.CF_PAGES_BRANCH !== 'main' ? process.env.CF_PAGES_URL : undefined)
    || 'https://djonko.dev',
  trailingSlash: 'always',
  // Notes merged into another note keep working at their old address.
  redirects: {
    '/vcf/library/troubleshooting/password-and-account-failures/': '/vcf/library/day-2/passwords-service-accounts/',
    '/vcf/library/troubleshooting/certificate-failures/': '/vcf/library/day-2/certificates-in-9/',
    '/vcf/library/troubleshooting/depot-and-download-failures/': '/vcf/library/upgrades/getting-binaries/',
    '/vcf/library/labs/offline-depot-in-a-lab/': '/vcf/library/upgrades/getting-binaries/',
    '/vcf/library/labs/esx-settings-for-labs/': '/vcf/library/labs/choosing-a-lab-approach/',
    '/vcf/library/labs/nested-lab-automation/': '/vcf/library/labs/choosing-a-lab-approach/',
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [mdx(), sitemap({ filter: (page) => !HIDDEN.test(new URL(page).pathname) }), devMedia],
  markdown: {
    remarkPlugins: [remarkMermaid],
    rehypePlugins: [rehypeTableWrap],
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' } },
  },
});
