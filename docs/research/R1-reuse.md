# R1: reuse scout for the djonko.dev overhaul

Scouted 2026-11-06. Scope: documentation reading experience (Astro), quality gates, public VCF code and data,
and open-source docs-site design references.

## Method and limits

- Repo facts (licence, stars, last push, archived flag) come from `gh api repos/<owner>/<name>` run on 2026-11-06.
  "Last push" is the `pushed_at` value the API returned.
- Release dates come from `gh api repos/<owner>/<name>/releases/latest` and are the publish dates of the tag shown.
- Web pages were fetched with WebFetch. Where a page showed no date, the table says so.
- Lines marked **[snippet]** come from a search result only. They were not opened and need checking against the primary page before use.
- GitHub API calls failed intermittently with "no route to host" or timeouts. Retried once after a pause. Failures are listed under "Unfetched or failed".
- Licences marked NOASSERTION were not resolved by the API. The repo page or LICENSE file must be read before reuse.

## Summary

- **Adopt (as separate tools or small dependencies):** Lychee, Vale, Lighthouse CI (run locally, not in GitHub Actions),
  Expressive Code (evaluate as the code-block layer), mermaid-cli (pre-render diagrams), rehype-citation (if references
  are added), remark-directive (callouts), rehype-autolink-headings (heading anchors). Keep axe-core and Mermaid as already present.
- **Borrow patterns, do not adopt the whole theme:** Starlight (MIT, 9527 stars) is the closest documentation theme,
  but adopting it means rebuilding 93 notes into a new layout. Borrow its navigation, search and TOC patterns first.
- **Link and cite, do not copy:** vmware/vcf-api-specs (Apache-2.0), vmware/vcf-security-and-compliance-guidelines
  (licence not resolved), Broadcom TechDocs, Broadcom developer API specification.
- **Reject for reuse:** lamw lab-deployment repos without a licence, archived VMware repos, and the VMware-alternatives awesome list.
- **Gap:** no verified content-freshness or review-date tool, and no source-citation checker beyond rehype-citation.
  No "awesome-vcf" list exists on GitHub (search returned none). The freshness and citation checks would need an in-house script.

---

## A. Documentation reading experience (Astro)

| Candidate | URL | Licence | Stars | Last push | Verdict | Why |
|---|---|---|---|---|---|---|
| Starlight | https://github.com/withastro/starlight | MIT | 9527 | 2026-11-06 | borrow | Astro docs theme. The official page (starlight.astro.build, fetched, no version shown) lists site navigation, search, i18n, SEO, code highlighting, dark mode, and Markdown/MDX with frontmatter validation. Full adoption means rebuilding the layout. Borrow sidebar, search and TOC patterns first. |
| Expressive Code | https://github.com/expressive-code/expressive-code | MIT | 969 | 2026-10-27 | adopt (evaluate) | Official page (expressive-code.com, fetched, no date shown) lists VS Code themes, window frames, text markers, collapsible sections, copy buttons, and a contrast check. Framework-agnostic; works with Astro and MDX. Latest plugin release: @expressive-code/plugin-frames 0.44.3 on 2026-10-21. Starlight uses it for code blocks **[snippet]**. Keep the site's own script-download source view. |
| starlight-links-validator | https://github.com/HiDeoo/starlight-links-validator | MIT | 128 | 2026-10-28 | watch | Validates internal links for Starlight sites only. Latest release 0.27.0 on 2026-10-09. Relevant only if the site moves to Starlight. |
| remark-gfm | https://github.com/remarkjs/remark-gfm | MIT | 1257 | 2025-02-10 | adopt (verify) | Tables, task lists and footnotes for remark. Check whether the current MDX pipeline already enables GFM before adding it. |
| rehype-autolink-headings | https://github.com/rehypejs/rehype-autolink-headings | MIT | 268 | 2024-09-16 | adopt | Adds anchor links to headings, which the TOC and citations can target. |
| rehype-slug | https://github.com/rehypejs/rehype-slug | MIT | 264 | 2023-08-31 | watch | Stale since 2023. Check whether Astro's own heading IDs are enough before adding it. |
| remark-toc | https://github.com/remarkjs/remark-toc | MIT | 499 | 2023-09-20 | reject | Stale. Build the TOC as an Astro component from the heading tree instead. |
| remark-directive | https://github.com/remarkjs/remark-directive | MIT | 429 | 2025-02-27 | adopt | Generic directives for callouts (note, warning, "as of" boxes), so authors write one syntax. |
| remark-math | https://github.com/remarkjs/remark-math | MIT | 519 | 2025-02-20 | watch | Only needed if notes carry formulas (sizing and capacity arithmetic). |
| rehype-citation | https://github.com/timlrx/rehype-citation | MIT | 85 | 2026-02-08 | adopt | CSL-based citations and bibliography. Latest release v2.3.2 on 2026-02-08. Fits the "every note has checked source links" rule if references are numbered. |
| rehype-external-links | https://github.com/rehypejs/rehype-external-links | MIT | 119 | 2023-09-03 | watch | Stale. Probably unnecessary: external-link attributes can be set in a component. |
| remark-lint (remarkjs) | https://github.com/remarkjs/remark-lint | MIT | 1041 | 2026-01-05 | watch | Markdown lint rules as remark plugins. Useful for note structure. |
| Mermaid | https://github.com/mermaid-js/mermaid | MIT | 91024 | 2026-11-06 | keep | Already in the build. Latest tag @mermaid-js/tiny 12.3.0 published 2026-11-03. |
| mermaid-cli | https://github.com/mermaid-js/mermaid-cli | MIT | 5157 | 2026-11-02 | adopt | Renders Mermaid to static SVG at build time, so pages ship no diagram JavaScript. Verify the output against the site's CSP. |
| D2 | https://github.com/d2lang/d2 | MPL-2.0 | 25800 | 2026-10-11 | watch | Diagram language for architecture diagrams. Latest release v0.9.0 on 2026-09-07. Use the CLI as a separate build step and commit the SVG. MPL-2.0 is file-level copyleft. |
| Pikchr (mirror) | https://github.com/drhsqlite/pikchr | not resolved | 157 | 2026-01-02 | watch | The repo describes itself as "Mirror for Pikchr". No licence was resolved (the API returned none and LICENSE.md returned 404). Read the upstream project page before any use. |
| pikru | https://github.com/bearcove/pikru | Apache-2.0 | 29 | 2026-06-18 | watch | Rust port of Pikchr. |
| Pagefind | https://github.com/Pagefind/pagefind | MIT | 5552 | 2026-11-05 | keep | Already in the build. Latest release v1.6.0 on 2026-11-01. |
| Shiki | https://github.com/shikijs/shiki | MIT | 13908 | 2026-11-02 | watch | The highlighter Astro uses by default. Only change it if Expressive Code takes over code blocks. |

## B. Quality gates

| Candidate | URL | Licence | Stars | Last push | Verdict | Why |
|---|---|---|---|---|---|---|
| Lychee | https://github.com/lycheeverse/lychee | Apache-2.0 OR MIT | 4100 | 2026-11-02 | adopt | Fast link checker for Markdown and HTML, with fragment checks. Docs (fetched) list binary, cargo, Docker and pre-commit installs. Last tag: lychee-v0.24.2 on 2026-05-01. Run it as a local binary against the built `dist/`. Keep the in-house internal-link check. |
| linkinator | https://github.com/JustinBeckwith/linkinator | MIT | 1286 | 2026-11-06 | watch | npm alternative to Lychee. Latest release linkinator-v8.1.0 on 2026-08-29. Keep as a fallback if the binary is awkward. |
| markdown-link-check | https://github.com/tcort/markdown-link-check | ISC | 723 | 2026-10-22 | watch | Node-based Markdown link checker. Overlaps with Lychee. |
| Lighthouse CI | https://github.com/GoogleChrome/lighthouse-ci | Apache-2.0 | 7131 | 2026-11-03 | adopt (local) | Lighthouse budgets per page. Run as an npm script against the preview build. Do not wire it into GitHub Actions. Latest release v0.16.0 on 2026-11-02. |
| Lighthouse | https://github.com/GoogleChrome/lighthouse | Apache-2.0 | 31023 | 2026-11-06 | keep | Engine behind Lighthouse CI. Latest release v13.6.0 on 2026-10-27. |
| axe-core | https://github.com/dequelabs/axe-core | MPL-2.0 | 7770 | 2026-11-05 | keep | Already a devDependency, used by `npm run audit`. Latest release v4.14.0 on 2026-10-05. Keep it out of the shipped bundle. |
| axe-core-npm | https://github.com/dequelabs/axe-core-npm | MPL-2.0 | 731 | 2026-11-06 | watch | Wrapper for running axe from Node. The current audit script already drives axe directly. |
| pa11y-ci | https://github.com/pa11y/pa11y-ci | LGPL-3.0 | 647 | 2026-11-01 | watch | A second accessibility runner. LGPL-3.0: use only as a separate CLI, never linked. Latest release 5.0.0 on 2026-10-05. Only worth it if a second opinion on a11y is wanted. |
| Alfa | https://github.com/Siteimprove/alfa | MIT | 135 | 2026-10-29 | watch | ACT-rules engine with EARL output (fetched repo page). Interesting for a rules-based audit, but adds a maintenance surface. |
| Vale | https://github.com/vale-cli/vale | MIT | 6340 | 2026-11-06 | adopt | Prose linter with YAML rule styles. Latest release v3.26.0 on 2026-10-31. Docs (docs.vale.sh/topics/styles, fetched) name the packaged style sets Microsoft, proselint and Std. A Google style was not confirmed. Write a small VCF terminology style (for example, product names and version wording) rather than relying on a generic one. |
| markdownlint-cli2 | https://github.com/DavidAnson/markdownlint-cli2 | MIT | 973 | 2026-11-04 | borrow | Structural Markdown rules. MDX needs care, so run it on plain `.md` only, or borrow the rule set. |
| remark-lint-no-dead-urls | https://github.com/remarkjs/remark-lint-no-dead-urls | MIT | 83 | 2026-06-03 | watch | Dead-URL rule for the remark pipeline. Overlaps with Lychee. |
| remark-validate-links | https://github.com/remarkjs/remark-validate-links | MIT | 125 | 2025-02-21 | watch | Validates Markdown links in the remark pipeline. Stale since early 2025. |
| Content freshness / review-date tooling | none verified | - | - | - | gap | GitHub repository search for freshness and review-date tooling returned no results. Recommend a small in-house check: a `reviewed` field in frontmatter, plus a build warning when it is older than a set window. Recommendation only, not a verified tool. |
| Source-citation checker | none verified beyond rehype-citation | - | - | - | gap | rehype-citation numbers and renders citations. It does not verify that a cited URL was opened. That needs an in-house check: each note's sources listed in frontmatter, with the link checker run over them. |

## C. Public VCF code and data

Licence and push dates are from the API. Verdicts assume the content is linked or summarised in our own words, not copied.

| Candidate | URL | Licence | Stars | Last push | Verdict | Why |
|---|---|---|---|---|---|---|
| vmware/vcf-api-specs | https://github.com/vmware/vcf-api-specs | Apache-2.0 | 23 | 2026-09-22 | adopt (link and cite) | API definitions for VCF components. Repo README (search result) says developers can use the definitions for languages the SDKs do not cover. **[snippet]** NSX specs are OpenAPI 2.0; other components are OpenAPI 3.0. |
| vmware/vcf-sdk-python | https://github.com/vmware/vcf-sdk-python | Apache-2.0 | 26 | 2026-09-22 | watch | Official Python SDK for VCF. Link from API notes. |
| vmware/vcf-sdk-go | https://github.com/vmware/vcf-sdk-go | BSD-2-Clause | 6 | 2026-10-27 | watch | Official Go SDK. Small community. |
| vmware/vcf-sdk-java | (listed in search, owner vmware) | Apache-2.0 | 9 | 2026-09-22 | watch | Official Java SDK. Metadata from search results. |
| vmware/vcf-security-and-compliance-guidelines | https://github.com/vmware/vcf-security-and-compliance-guidelines | not resolved (LICENSE linked, type not stated) | 161 | 2026-08-28 | borrow (link, summarise) | Broadcom-managed. Repo page (fetched) lists six folders: features-capabilities, regulatory-compliance, security-advisories, security-configuration-hardening-guide, security-design, threat-resources. Says it is "intended to provide general guidance". Primary source for security and hardening notes. Read the LICENSE before any reuse. |
| vmware/terraform-provider-vcf | https://github.com/vmware/terraform-provider-vcf | MPL-2.0 | 36 | 2026-10-15 | watch (link) | Official Terraform provider for VCF. Link from automation notes. Do not bundle. |
| vmware/terraform-provider-vcfa | https://github.com/vmware/terraform-provider-vcfa | MPL-2.0 | 15 | 2026-11-02 | watch (link) | Terraform provider for VCF Automation. |
| vmware/terraform-vcf-toolkit | https://github.com/vmware/terraform-vcf-toolkit | MPL-2.0 | 8 | 2026-08-11 | watch | Terraform toolkit for VCF deployments. |
| vmware/vmware-vcf-operations-integration-sdk | https://github.com/vmware/vmware-vcf-operations-integration-sdk | Apache-2.0 | 22 | 2026-11-04 | watch | SDK for building management packs for VCF Operations. Relevant to day-2 and integration notes. |
| vmware/validated-solutions-for-cloud-foundation | https://github.com/vmware/validated-solutions-for-cloud-foundation | BSD-2-Clause | 27 | 2026-03-19 | watch | Companion to VMware Validated Solutions for VCF. Older design material; check against current releases. |
| vmware/vcf-upgrade-precheck | https://github.com/vmware/vcf-upgrade-precheck | NOASSERTION | 2 | 2026-11-05 | watch | Pre-check for VCF 9.1.x upgrades (repo description, search result). Relevant to the upgrades area. Read the LICENSE first. |
| vmware/vcf-upgrade-planner | https://github.com/vmware/vcf-upgrade-planner | NOASSERTION | 11 | 2026-11-05 | watch | Upgrade planning tool. Read the LICENSE first. |
| vmware/vcf-readiness | https://github.com/vmware/vcf-readiness | NOASSERTION | 25 | 2026-10-30 | watch | Readiness checks. No description in the API. Read the LICENSE first. |
| vmware/powershell-module-for-vmware-cloud-foundation-jsongenerator | https://github.com/vmware/powershell-module-for-vmware-cloud-foundation-jsongenerator | NOASSERTION | 5 | 2026-11-06 | watch | Companion for the VCF 9.0 planning and preparation workbook (repo description, search result). |
| vmware/powershell-module-for-vmware-cloud-foundation-reporting | https://github.com/vmware/powershell-module-for-vmware-cloud-foundation-reporting | NOASSERTION | 22 | 2026-08-12 | watch | Reporting module. |
| vmware/powershell-module-for-vmware-cloud-foundation-power-management | https://github.com/vmware/powershell-module-for-vmware-cloud-foundation-power-management | Other | 13 | 2026-07-28 | watch | Power management module. |
| vmware/vcf-cli | https://github.com/vmware/vcf-cli | NOASSERTION | 4 | 2026-09-23 | watch | CLI for VCF. Small. |
| vmware/vcf-services | https://github.com/vmware/vcf-services | Other | 6 | 2026-10-19 | watch | Developer documentation for VCF Services (repo description, search result). |
| vmware-archive/powershell-module-for-vmware-cloud-foundation | https://github.com/vmware-archive/powershell-module-for-vmware-cloud-foundation | BSD-2-Clause | 40 | archived 2026-09-01 | reject | Archived. Use the successor modules above. |
| vmware/Holodeck | https://github.com/vmware/Holodeck | Apache-2.0 | 35 | 2026-11-06 | borrow (docs pattern) | Source for the Holodeck 9 documentation site (repo page, fetched). Toolkit deploys nested VCF labs on one ESX host or a vSphere cluster; the repo page says it is "not an officially supported product". Site built with mkdocs.yml and Zensical. Useful as a lab-tooling reference and docs-build example. |
| lamw/vmware-scripts | https://github.com/lamw/vmware-scripts | BSD-2-Clause | 955 | 2026-10-02 | borrow (snippets with attribution) | William Lam's script collection. Check each script's own header before reuse. |
| lamw/vcf-infrastructure-service-appliance | https://github.com/lamw/vcf-infrastructure-service-appliance | Apache-2.0 | 16 | 2026-11-05 | watch | Infrastructure services appliance for VCF 9.1 labs (repo description, search result). |
| lamw/vcf-automated-lab-deployment | https://github.com/lamw/vcf-automated-lab-deployment | none shown | 85 | 2025-03-14 | reject for reuse (link only) | No licence on the repo. Stale since March 2025. |
| lamw/vcf-9x-in-box | https://github.com/lamw/vcf-9x-in-box | none shown | 49 | 2026-04-29 | reject for reuse (link only) | No licence on the repo. |
| lamw/vcf-91-in-box | https://github.com/lamw/vcf-91-in-box | none shown | 11 | 2026-09-23 | reject for reuse (link only) | No licence on the repo. |
| lamw/vcf-fleet-automated-lab-deployment | https://github.com/lamw/vcf-fleet-automated-lab-deployment | none shown | 33 | 2026-06-06 | reject for reuse (link only) | No licence on the repo. |
| lamw/PowerCLI-Example-Scripts | https://github.com/lamw/PowerCLI-Example-Scripts | NOASSERTION | 31 | 2024-06-18 | watch | Older examples. Stale. |
| vmware-archive/PowerCLI-Example-Scripts | https://github.com/vmware-archive/PowerCLI-Example-Scripts | NOASSERTION | 779 | archived 2025-01-13 | reject | Archived. |
| vmware-archive/powerclicore | https://github.com/vmware-archive/powerclicore | Apache-2.0 | 102 | archived 2023-12-20 | reject | Archived. |
| vmware-archive/vsphere-automation-sdk-python | https://github.com/vmware-archive/vsphere-automation-sdk-python | MIT | 799 | archived 2026-04-13 | reject | Archived. |
| Broadcom developer VCF API Specification | https://developer.broadcom.com/sdks/vcf-api-specification/latest/ | Broadcom SDK licence terms **[snippet]** | - | - | adopt (link) | Search snippet lists Installer, Operations, vSAN Data Protection, SDDC Lifecycle and Fleet Lifecycle OpenAPI specs. Not fetched in this run. |
| Broadcom KB 436633 | https://knowledge.broadcom.com/external/article/436633/vcfa-rest-api-endpoints-are-not-included.html | - | - | - | adopt (cite) | **[snippet]** says VCF Automation REST endpoints are not in the VCF 9 OpenAPI spec. Verify on the page before citing. |
| Broadcom TechDocs (VCF 9.x) | https://techdocs.broadcom.com | - | - | - | adopt (primary source) | Primary source for every version and licensing fact. Not fetched in this run. Search surfaced a 9.1 upgrade path under vcf-9-0-and-later/9-1 **[snippet]**. |
| awesome-vmware (alexgoesgit) | https://github.com/alexgoesgit/awesome-vmware | CC0-1.0 | 36 | 2026-10-28 | reject | List of VMware alternatives, not VCF material. |
| Awesome-list search for VCF | - | - | - | - | gap | `gh search repos` for "awesome vcf", "awesome vmware cloud foundation" and "awesome vsphere" returned no repositories. No awesome-vcf list was found. |

### Content leads from search snippets (verify on primary pages before use)

- Broadcom KB 314608 maps VCF versions to release notes: 9.0 (June 2025), 9.0.1.0 (September 2025), 9.0.2.0 (January 2026), 9.1.0 (May 2026), 9.1.1 (September 2026) **[snippet]**. Source: https://knowledge.broadcom.com/external/article/314608/correlating-vmware-cloud-foundation-vers.html
- The 9.1.0 general-availability date conflicts: the KB gives May 12, one third-party article gives May 25 **[snippet]**. Use Broadcom's own date.
- Licensing: the VCF 9.1 private license file guide says vSAN add-ons license per TiB and VMware Private AI Foundation per core **[snippet]**. Source: https://vcf.broadcom.com/vcf/clm/assets/VCF-9.1-Licensing-Private-License-Files.pdf
- Installer: third-party coverage says Cloud Builder is replaced by the VCF Installer, and vVols are deprecated **[snippet]**.
- VMware blog for 9.1 (2026-05-25) says the Unified VCF SDK now covers NSX, VCF Operations, Log Management and VCF Operations for Network **[snippet]**. https://blogs.vmware.com/cloud-foundation/2026/05/25/unlocking-the-full-potential-of-programmable-infrastructure-with-vmware-cloud-foundation-9-1-new-features-and-capabilities/

## D. Design references (open docs sites with public source)

| Candidate | URL | Licence | Stars | Last push | Verdict | Why |
|---|---|---|---|---|---|---|
| withastro/docs | https://github.com/withastro/docs | MIT | 1700 | 2026-11-06 | borrow | Astro's own docs site. Information architecture, sidebar and search layout for a large Astro docs site. |
| alphagov/govuk-frontend | https://github.com/alphagov/govuk-frontend | MIT | 1477 | 2026-11-06 | borrow | Accessibility-first components and tokens. Good reference for plain, legible reading layout. |
| carbon-design-system/carbon | https://github.com/carbon-design-system/carbon | Apache-2.0 | 9606 | 2026-11-06 | borrow | Design tokens and documentation patterns. |
| primer/css | https://github.com/primer/css | MIT | 13053 | 2026-11-06 | borrow | Tokens, spacing and typography scale. |
| github/docs | https://github.com/github/docs | CC-BY-4.0 | 21333 | 2026-11-06 | borrow (patterns only) | Large public docs site. Content is CC-BY-4.0, so do not copy text without attribution. |
| kubernetes/website | https://github.com/kubernetes/website | CC-BY-4.0 | 5421 | 2026-11-06 | borrow (patterns only) | Versioned reference documentation. Content licence applies to any copied text. |
| mdn/content | https://github.com/mdn/content | NOASSERTION | 11127 | 2026-11-06 | watch | Large reference docs. Licence not resolved in this run. |
| meta/docusaurus | https://github.com/facebook/docusaurus | MIT | 66662 | 2026-11-06 | watch | React-based docs framework. Not Astro, so patterns only. |
| fuma-nama/fumadocs | https://github.com/fuma-nama/fumadocs | MIT | 13565 | 2026-11-06 | watch | Next.js docs framework. Patterns only. |
| shuding/nextra | https://github.com/shuding/nextra | MIT | 13947 | 2026-07-31 | watch | Next.js docs framework. Patterns only. |
| xocothemes/compass | https://github.com/xocothemes/compass | Other | 10 | 2026-10-21 | reject | Astro docs theme with an unclear licence. |
| supportgenix/supportgenix-docs | https://github.com/supportgenix/supportgenix-docs | ISC | 9 | 2026-05-29 | reject | Small Astro docs theme. |
| lameuler/atlas | https://github.com/lameuler/atlas | MIT | 2 | 2026-06-22 | reject | Small Astro docs theme. |
| Stripe docs, linear.app | - | not open source | - | - | reference only | No public source. Screenshot as design references only. |

Note on star counts: stars are a weak signal. Verdicts rest on licence, activity, fit and security.

## Unfetched or failed

- `pikchr.org` documentation URL returned 404 when fetched.
- `github.com/drhsqlite/pikchr/blob/trunk/LICENSE.md` returned 404 when fetched. Pikchr licence not resolved.
- `gh api` returned 404 for: jgm/pikchr, vmware-samples/vcf-automation-samples, vmware/vcf-holodeck-toolkit, lamw/vmware-scripts-and-tools, mheap/astro-expressive-code, vmware/vcf-lab-constructor, vale-cli/styles, errata-ai/styles.
- `gh api` timed out for vmware/pyvmomi (network).
- Broadcom TechDocs and developer.broadcom.com pages were not fetched directly. Facts from them are marked [snippet].
- The Starlight docs site and the Expressive Code site were fetched, but they show no version or date.

## Next steps for the content lead

1. Read the LICENSE for every NOASSERTION repo before linking it in a note that is shipped.
2. Verify the Broadcom release and licensing facts on TechDocs and the KB before writing them.
3. Spike Expressive Code and Lychee in a worktree branch, then measure against the Lighthouse budget.
