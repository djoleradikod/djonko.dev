import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_IDS } from './data/categories';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(320),
    category: z.enum(CATEGORY_IDS),
    order: z.number(),
    versions: z.array(z.enum(['5.x', '9.0', '9.1', '9.1.1'])).min(1),
    level: z.enum(['Overview', 'Practitioner', 'Deep dive']),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // The day the note's sources were last opened and its dated claims checked against them.
    // It says the facts were checked, not who checked them or that the author has run the steps.
    reviewed: z.coerce.date().optional(),
    // Set when something in the note is known to date soon, such as an announced release.
    reviewDue: z.coerce.date().optional(),
    kbs: z.array(z.number()).default([]),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
      by: z.string().optional(),
      // What kind of evidence this is, so a reader can weigh it. Commissioned research is 'sponsored'.
      kind: z.enum(['broadcom', 'practitioner', 'press', 'analyst', 'sponsored', 'vendor', 'tracker', 'reference']).optional(),
      // The source's own publication or update date, as it shows on the page.
      date: z.coerce.date().optional(),
    })).default([]),
    draft: z.boolean().default(false),
  }),
});

// Blog: write-ups, case studies, announcements. Not tied to the VCF library categories.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().max(320),
    pubDate: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    kind: z.enum(['Write-up', 'Case study', 'Announcement', 'Video']).default('Write-up'),
    series: z.string().optional(),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }).refine((d) => !d.cover || d.coverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] }),
});

// Tool naming rule: "<Tool> for VCF Operations", never "VCF <Tool>".
const toolName = z.string()
  .refine((n) => !/^VCF\b/i.test(n), 'Name tools "<Tool> for VCF Operations", not "VCF <Tool>"')
  .refine((n) => / for VCF Operations$/.test(n), 'Name must end with " for VCF Operations"');

// Projects: one page per tool at /projects/<slug>/. The MDX file holds the story, screenshots and video;
// the facts (version, compatibility, permissions, links) come from the repo's release project.json,
// cached in src/data/projects/<slug>.json by `npm run sync:projects`.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    displayName: toolName,
    summary: z.string().max(240),
    kind: z.enum(['script', 'agent', 'management-pack']),
    status: z.enum(['Planned', 'In development', 'Preview', 'Stable', 'Retired']),
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(), // owner/name; default <owner>/<slug>-for-vcf-operations
    pubDate: z.coerce.date(),
    order: z.number().default(100),
    featured: z.boolean().default(false),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    youtube: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// project.json, schema 1, as published with every tool release.
const projectMeta = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/projects' }),
  schema: z.object({
    schema: z.literal(1),
    name: z.string(),
    displayName: toolName,
    slug: z.string(),
    kind: z.enum(['script', 'agent', 'management-pack']),
    managementPackApproach: z.string().optional(),
    summary: z.string(),
    description: z.string().optional(),
    version: z.string(),
    licence: z.string(),
    author: z.object({ name: z.string(), url: z.string().url().optional() }).optional(),
    baseline: z.string(),
    compatibility: z.array(z.object({
      release: z.string().optional(), vcfOperations: z.string(), vcf: z.string().optional(),
      status: z.enum(['tested', 'supported', 'untested', 'unsupported']), notes: z.string().optional(),
    })).min(1),
    permissions: z.object({
      summary: z.string(), account: z.string().optional(), role: z.string().optional(),
      privileges: z.array(z.object({ area: z.string(), access: z.string(), reason: z.string() })).default([]),
      notRequired: z.array(z.string()).default([]),
    }),
    topics: z.array(z.string()).default([]),
    links: z.object({
      projectPage: z.string().optional(), repository: z.string().url(), releases: z.string().url().optional(),
      latestRelease: z.string().url().optional(), issues: z.string().url().optional(), changelog: z.string().url().optional(),
    }),
    notAffiliated: z.string().optional(),
    fetchedAt: z.string().optional(),
  }),
});

export const collections = { articles, posts, projects, projectMeta };
