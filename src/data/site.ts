// Site-wide settings. Fill in `links` before launch: empty values are left off the
// page and out of the Person schema.
export const SITE = {
  name: 'Jay Djonko',
  // The host name comes from the build's site URL (SITE_URL, or the default in astro.config.mjs),
  // so moving from a free subdomain to the purchased domain is a one-variable change.
  domain: new URL(import.meta.env.SITE ?? 'https://djonko.dev').host,
  // Search engines may index the site only when it is built for this host. Every other build
  // (pages.dev, a leasebook.ie subdomain, a preview branch, a local build) is noindex automatically,
  // so a copy of the site can never compete with the real one in search results.
  productionHost: (import.meta.env.PUBLIC_PRODUCTION_HOST as string | undefined) || 'djonko.dev',
  author: 'Jay Djonko',
  role: 'VCF Tech Lead',
  tagline: 'VMware Cloud Foundation tech lead: architecture, upgrades, operations and troubleshooting, plus open tools for VCF Operations.',
  vcfName: 'VCF Field Notes',
  vcfTagline: 'Practical notes on VMware Cloud Foundation 5.x and 9.x: architecture, upgrades, operations and troubleshooting.',
  disclaimer: 'Personal notes. Not official vendor guidance: always confirm against current Broadcom documentation and KBs before changing production.',
  affiliation: 'Not affiliated with Broadcom. VMware, VCF, vSphere, vSAN and NSX are trademarks of Broadcom.',
  photo: '', // e.g. '/img/jay-djonko.jpg' (square, at least 400 px). Use the same photo as LinkedIn and GitHub.
  // Large media (video, big PDFs) is served from /media on the Hetzner host, or from another
  // origin such as an R2 bucket when the site runs on Cloudflare Pages. See deploy/README.md.
  mediaBase: (import.meta.env.PUBLIC_MEDIA_URL as string | undefined) || '/media',
  // GitHub owner of the tool repositories (<slug>-for-vcf-operations).
  githubOwner: 'djoleradikod',
  // Public repository of this site, for "Report a problem" links that open a GitHub issue.
  // Leave empty (PUBLIC_SOURCE_REPO=) to send readers to the contact page instead.
  sourceRepo: (import.meta.env.PUBLIC_SOURCE_REPO as string | undefined) ?? 'djoleradikod/djonko.dev',
  // Optional privacy-friendly analytics. Leave empty for none.
  analytics: {
    cloudflareToken: (import.meta.env.PUBLIC_CF_ANALYTICS_TOKEN as string | undefined) || '',
    plausibleDomain: (import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN as string | undefined) || '',
    plausibleSrc: (import.meta.env.PUBLIC_PLAUSIBLE_SRC as string | undefined) || 'https://plausible.io/js/script.js',
  },
  links: {
    linkedin: '', // https://www.linkedin.com/in/<handle>/
    github: 'https://github.com/djoleradikod',
    email: '',    // public contact address, if any
  },
};

/** True only for a build of the production host without PUBLIC_NOINDEX=1. */
export const indexable = SITE.domain === SITE.productionHost && import.meta.env.PUBLIC_NOINDEX !== '1';

export const sameAs = () => [SITE.links.linkedin, SITE.links.github].filter(Boolean);

/** Resolve a media path (e.g. 'video/triage.mp4') against the media origin. Absolute URLs pass through. */
export const mediaUrl = (path: string) =>
  /^https?:\/\//.test(path) || path.startsWith('/') ? path : `${SITE.mediaBase.replace(/\/$/, '')}/${path}`;

/** A link that opens a new issue on the site's repository, with an issue form's fields filled in. Empty when there is no public repository. */
export function issueUrl(fields: Record<string, string>): string {
  if (!SITE.sourceRepo) return '/contact/';
  return `https://github.com/${SITE.sourceRepo}/issues/new?${new URLSearchParams(fields)}`;
}
