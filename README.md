# djonko.dev

Personal site of Jay Djonko, VCF Tech Lead: portfolio, blog, VCF field notes, project pages for the tools
for VCF Operations, and a CV. Static, fast, accessible, and portable between Hetzner, Cloudflare Pages and Netlify.

| Path | What | Source |
|---|---|---|
| `/` | Portfolio home | `src/pages/index.astro` |
| `/about/`, `/contact/`, `/talks/` | About, contact, workshop series | `src/pages/*.astro` |
| `/cv/` | Print-ready CV (hidden until published) | `src/data/cv.ts` |
| `/vcf/` | VCF Field Notes: 82 notes in 8 areas, KB index, cheat sheet, glossary | `src/content/articles/`, `src/pages/vcf/` |
| `/blog/` | Write-ups, case studies, videos; tags, reading time, related posts | `src/content/posts/` |
| `/projects/<slug>/` | One page per tool, facts from the repo's release `project.json` | `src/content/projects/`, `src/data/projects/` |
| `/guide/` | Authoring guide with a live example of every content type (hidden) | `src/pages/guide/index.mdx` |

## Content types

Images (AVIF/WebP, zoom), galleries, self-hosted video with captions, YouTube/Vimeo without tracking until
play, Mermaid and SVG diagrams, script downloads with source view and SHA-256, PDFs with inline preview,
step lists, 5.x vs 9.x comparisons, KB links. See `/guide/` after `npm run dev`.

## Work on it

```bash
npm ci
npm run dev             # http://localhost:4321 (drafts visible, ./media served at /media)
npm run build           # build + search index + share images + privacy scan + link check
npm run audit           # browser audit: accessibility, CSP/console errors, broken images, page weight
npm run sync:projects   # refresh tool facts from GitHub releases
npm run pdfs            # re-print site PDFs (then build again)
```

Settings (name, links, photo, media origin, analytics): `src/data/site.ts`.
Deploying: `deploy/README.md`. CI: `.github/workflows/site.yml`.

## Rules the build enforces

- Tool names must be "<Tool> for VCF Operations"; project facts come from each release's `project.json`.
- No private names, internal hostnames, non-documentation IP addresses, emails or proprietary markings
  (`scripts/privacy-scan.mjs`).
- No broken internal links (`scripts/check-content.mjs`); covers need alt text.

Not affiliated with Broadcom. VMware, VCF, vSphere, vSAN and NSX are trademarks of Broadcom.
