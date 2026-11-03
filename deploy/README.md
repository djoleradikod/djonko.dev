# Deploying djonko.dev

The site is static. `npm run build` writes everything to `dist/` (pages, search index, share images,
downloads) and stops if the privacy scan or the link check finds anything. Any of the options below can
host it, and you can switch between them without changing the site.

| | Hetzner (recommended) | Cloudflare Pages | Blacknight hosting | Netlify |
|---|---|---|---|---|
| Large video and PDFs | Yes, `/media` on the same host | 25 MiB per-file limit; media on R2 or Hetzner | Yes, within the plan's disk quota | Same approach as Pages |
| Rollback | Instant, last 5 releases kept | Instant from the dashboard | Redeploy the previous build | Instant from the dashboard |
| Switch-over | Atomic | Atomic | File by file during upload | Atomic |
| Cost | The server you already have | Free | The plan you already have | Free tier |
| Set-up | `bootstrap.sh` once, then `deploy.sh` or CI | Connect the repo or `wrangler` | cPanel domain, then `deploy.sh` or CI | Connect the repo |

Recommended set-up: Hetzner serves the site and media; Cloudflare sits in front for DNS, caching and DDoS
protection (orange-cloud proxy, SSL mode **Full (strict)**). Pages stays available as a fallback that needs
no server.

## Launch path: free address today, own domain later

The site takes its address from one setting, `SITE_URL`. Canonical links, the sitemap, the RSS feed, share
images and the Person schema all follow it, so moving to a new address is a rebuild, not an edit.

### Stage 1: publish today on a free address

Pick one. Option A is the quickest; option B uses hosting you already pay for.

**A. Cloudflare Pages, `djonko-dev.pages.dev`, connected to GitHub (the set-up in use)**

Cloudflare builds every push to `djoleradikod/djonko.dev` itself. The site stays private behind
Cloudflare Access until launch day. The full set-up is in [Cloudflare Pages with GitHub](#cloudflare-pages-with-github).

Without the repository (a one-off upload from a laptop) the same result is:

```bash
npx wrangler login                                  # once, opens the browser
SITE_URL=https://djonko-dev.pages.dev npm run build
npx wrangler pages deploy dist --project-name djonko-dev
```

**B. A subdomain of a domain you already own, on Blacknight hosting**

In cPanel, create a subdomain such as `jay.leasebook.ie` (if the domain's DNS is at Blacknight, cPanel creates its folder and DNS record, and
AutoSSL issues the certificate within a few minutes). Then:

```bash
SITE_URL=https://jay.leasebook.ie PUBLIC_NOINDEX=1 npm run build
BN_HOST=<cPanel server name> BN_USER=<cPanel user> BN_PASS='<password>' BN_DIR=jay.leasebook.ie \
  deploy/blacknight/deploy.sh --skip-build
```

Search engines must index only the final domain, otherwise the two addresses compete in results. A build
for any host other than `djonko.dev` is marked noindex automatically (robots.txt, a robots meta tag on every
page, and on Pages an `X-Robots-Tag` header), so nothing needs remembering here. `PUBLIC_NOINDEX=1` forces
the same for a `djonko.dev` build, for example a staging copy on Hetzner.

### Stage 2: buy the domain at Blacknight

Blacknight registers `.dev` domains. Note that every `.dev` domain is on the browsers' HSTS preload list,
so it works only over HTTPS. All hosting options here serve HTTPS, so that is not a problem, but a plain
HTTP test page will not load.

Then choose where DNS lives:

- **Keep DNS at Blacknight** (simplest). In the Blacknight control panel, open DNS management for the
  domain and set:

  | Host | Type | Value | For |
  |---|---|---|---|
  | `@` | A | Hetzner server IPv4 | Hetzner |
  | `@` | AAAA | Hetzner server IPv6 | Hetzner |
  | `www` | CNAME | `djonko.dev.` | Hetzner (Caddy redirects www to the bare domain) |

  For Blacknight hosting instead, add the domain as an addon domain in cPanel; the DNS is then set for you.
  Cloudflare Pages needs the domain's DNS on Cloudflare for the bare domain, so with Pages use the next option.

- **Move DNS to Cloudflare** (adds caching, DDoS protection and Pages support). Add the domain to a free
  Cloudflare account, then replace the nameservers in the Blacknight control panel with the two Cloudflare
  gives you. The domain stays registered and billed at Blacknight; only DNS moves. Then follow the Hetzner
  DNS steps below, or attach the domain to the Pages project under Custom domains.

### Stage 3: move to the domain

1. Change `SITE_URL` to `https://djonko.dev` (or remove it: that is the default) and remove `PUBLIC_NOINDEX` if set.
2. Build and deploy to the final host.
3. Redirect the free address to the domain, so links already shared keep working:
   - Pages: in Cloudflare, add a Bulk Redirect from `djonko-dev.pages.dev` to `https://djonko.dev`, preserving path.
   - Blacknight subdomain: replace its folder's `.htaccess` with
     `RewriteEngine On` and `RewriteRule ^(.*)$ https://djonko.dev/$1 [R=301,L]`.
   - Hetzner: add a site block `jay.leasebook.ie { redir https://djonko.dev{uri} permanent }` to the Caddyfile.
4. Submit the new sitemap in Search Console and Bing Webmaster Tools (see "After launch").

## Hetzner (Ubuntu 24.04)

### Once: prepare the server

```bash
# on your laptop: a key for deployments (CI uses the same one)
ssh-keygen -t ed25519 -f ~/.ssh/djonko_deploy -C djonko-deploy

scp deploy/hetzner/bootstrap.sh deploy/hetzner/Caddyfile root@<server>:/root/
ssh root@<server> "DOMAIN=djonko.dev EMAIL=<your email> DEPLOY_KEY='$(cat ~/.ssh/djonko_deploy.pub)' bash /root/bootstrap.sh"
```

`bootstrap.sh` is safe to run again. It:

- installs Caddy from its official repository (automatic HTTPS, HTTP/2 and HTTP/3);
- creates a `deploy` user that can write only `/srv/djonko.dev`;
- lays out `/srv/djonko.dev/releases/`, `current` (a link to the live release) and `media/`;
- installs the Caddyfile, validating it first;
- opens 80/tcp, 443/tcp and 443/udp in ufw and keeps SSH (`SSH_PORT=2222` if you moved it);
- turns on unattended security updates.

If the server also has a Hetzner Cloud Firewall, allow the same ports there.

### DNS and certificates

1. Add `A` (and `AAAA`) records for `djonko.dev` and `www.djonko.dev` pointing at the server.
2. Leave them **DNS only** (grey cloud) until the site loads over HTTPS. Caddy gets its Let's Encrypt
   certificates on the first request.
3. Then switch both records to **Proxied** and set Cloudflare SSL/TLS to **Full (strict)**. Renewals keep working
   through the proxy over HTTP-01. If you would rather not depend on that, create a Cloudflare Origin
   Certificate, save it on the server, and add `tls /etc/caddy/origin.pem /etc/caddy/origin.key` inside the
   `djonko.dev` block.

### Every time: deploy

```bash
DEPLOY_HOST=deploy@<server> SSH_OPTS="-i ~/.ssh/djonko_deploy" deploy/hetzner/deploy.sh          # site
DEPLOY_HOST=deploy@<server> SSH_OPTS="-i ~/.ssh/djonko_deploy" deploy/hetzner/deploy.sh --media  # site + media/
```

Each deploy uploads a new release folder (unchanged files are hard-linked, so it is quick), switches
`current` to it in one atomic rename, pre-compresses text files with Brotli and gzip for Caddy, then
smoke-tests the live site. Readers never see a half-uploaded site.

```bash
DEPLOY_HOST=deploy@<server> deploy/hetzner/rollback.sh --list    # releases on the server
DEPLOY_HOST=deploy@<server> deploy/hetzner/rollback.sh           # back one release
```

## GitHub Actions (build, check, deploy)

`.github/workflows/site.yml` runs on every pull request and push, and weekly:

1. `npm ci`, refresh tool facts from each repo's release `project.json`, build (privacy scan and link check included).
2. Browser audit of every page: accessibility (WCAG 2.2 AA rules), security-policy and console errors,
   broken images, and a page-weight budget.
3. Validate the Caddyfile with the official Caddy image.
4. On `main`, deploy to whichever targets are switched on.

Repository settings, under Secrets and variables, then Actions:

| Name | Type | Value |
|---|---|---|
| `DEPLOY_HETZNER` | variable | `true` |
| `HETZNER_HOST` | secret | `deploy@<server ip>` |
| `HETZNER_SSH_KEY` | secret | contents of `~/.ssh/djonko_deploy` |
| `HETZNER_KNOWN_HOSTS` | secret | output of `ssh-keyscan <server ip>` |
| `DEPLOY_PAGES` | variable | `true` to also (or instead) deploy to Cloudflare Pages |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | secrets | for Pages |
| `SITE_URL`, `PUBLIC_NOINDEX` | variables | only before launch, see below |

## Cloudflare Pages with GitHub

This is the set-up in use: the Pages project `djonko-dev` is connected to the GitHub account `djoleradikod`.
Cloudflare builds and deploys; the GitHub Actions workflow is the gate that checks every change. Before
launch, every Cloudflare address is closed with Cloudflare Access, so only you can open it.

### 1. GitHub: limit what Cloudflare can see

1. Create `djoleradikod/djonko.dev` as a **private** repository. Make it public at launch, or never; Pages
   builds private repositories the same way.
2. Add `Kninsay` under Settings, Collaborators, with **Write** access, so changes arrive as pull requests.
3. At github.com/settings/installations, open **Cloudflare Workers and Pages**, Configure. Under Repository
   access choose **Only select repositories** and pick `djonko.dev`. "All repositories" gives Cloudflare
   read access to every repository on the account, including ones created later.
4. Settings, Rules, Rulesets, new branch ruleset for `main`: block force pushes and deletion, require a pull
   request, and require the status checks `build` (this workflow) and `Cloudflare Pages`. Add yourself to the
   bypass list so you can still push a fix directly when needed.

### 2. Cloudflare: create the project from the repository

Workers & Pages, Create, Pages, **Connect to Git**, choose `djoleradikod/djonko.dev`, then:

| Setting | Value |
|---|---|
| Project name | `djonko-dev` (gives `djonko-dev.pages.dev`) |
| Production branch | `main` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | empty |
| Environment variables, Production | `SITE_URL` = `https://djonko-dev.pages.dev` (until launch) |
| Environment variables, Preview | none. Preview builds take their own address from `CF_PAGES_URL`. |

Node comes from `.node-version` (22). Under Settings, Build, keep the build system at version 3.

Under Settings, Build, **Branch control**: production deployments on for `main`; preview deployments for
**Custom branches**, include `*`, exclude `dependabot/*`. Dependabot pull requests are checked by the GitHub
workflow; previews of them only spend the 500 builds a month on the free plan.

### 3. Cloudflare Access: close the site until launch

Turning on Access in the Pages project protects previews only. The production `djonko-dev.pages.dev`
address needs one more step (Cloudflare documents this under Pages, Known issues):

1. Pages project, Settings, General, **Enable access policy**. This creates an Access application for
   `*.djonko-dev.pages.dev` (previews).
2. Zero Trust, Access, Applications: open that application, edit its hostname and **remove the `*`
   subdomain**, so it covers `djonko-dev.pages.dev` itself. Rename it if Cloudflare reports a duplicate.
3. Back in the Pages project, Enable access policy again. There should now be two applications: one for
   `djonko-dev.pages.dev` and one for `*.djonko-dev.pages.dev`.
4. In each application's policy: action **Allow**, include **Emails** with your own address. Sign-in method
   One-time PIN (the default) is enough; session duration 24 hours.

Check it from any machine; the script only reads:

```bash
scripts/verify-private.sh https://djonko-dev.pages.dev https://<any preview hash>.djonko-dev.pages.dev
```

Each address should report `PASS ... behind Cloudflare Access`. Even with Access off, `public/_headers` sends
`X-Robots-Tag: noindex` on every `pages.dev` address and the build disallows crawling for any host other
than `djonko.dev`. That keeps it out of search results, but it does not keep people out: Access does that.

### 4. Day to day

- A pull request gets a GitHub check from the workflow and a protected preview at
  `https://<branch>.djonko-dev.pages.dev`. Merging to `main` deploys production.
- Rollback: Pages project, Deployments, the previous production deployment, **Rollback**. It is instant and
  needs no rebuild.
- Leave the workflow variable `DEPLOY_PAGES` unset. It is for direct uploads only, and with the repository
  connected it would deploy a second time, racing Cloudflare's own build.
- Free plan limits that apply: 500 builds a month, 20 minutes per build, 25 MiB per file, 20,000 files. The
  site uses about 450 files, none over 5 MiB. Video and large PDFs go to R2 or Hetzner through
  `PUBLIC_MEDIA_URL`.

### 5. Launch day

1. Buy the domain, then Pages project, Custom domains, add `djonko.dev` and `www.djonko.dev` (see stage 2 for
   where DNS lives).
2. Production variables: set `SITE_URL` to `https://djonko.dev` and remove `PUBLIC_NOINDEX` if set. Retry the
   latest deployment so it rebuilds with the new address.
3. The custom domain is not under Access, so it is now public. Leave both Access applications on
   `pages.dev` in place: that copy stays private and noindex, and canonical links point at `djonko.dev`.
4. Submit the sitemap (see "After launch").

## Blacknight web hosting (cPanel)

`deploy/blacknight/deploy.sh` uploads `dist/` over SFTP (or FTPS with `BN_PROTO=ftps`) using `lftp`, adds an
`.htaccess` with HTTPS and www redirects, security headers, caching and the 404 page, and uploads `./media`
to `/media`. Get the server name and credentials from the Blacknight control panel (cPanel, FTP Accounts, or
the welcome email). In CI, set `DEPLOY_BLACKNIGHT=true` and the `BN_*` secrets.

## Netlify

`netlify.toml` has the build settings and Netlify reads `public/_headers` too.

## Optional: Docker

`deploy/docker/` builds the site and serves it with nginx on `127.0.0.1:8080`, for a private preview on any
Docker host:
`SITE_URL=https://preview.example PUBLIC_NOINDEX=1 docker compose -f deploy/docker/docker-compose.yml up -d --build`.

## Offline reading (service worker)

`public/sw.js` keeps every page a reader opens, plus anything they save from `/offline/` or a reading
path, so it opens without a connection. Pages are network first, so an online reader always gets the
current version; hashed files under `/_astro/` are cache first. Every host config here serves
`/sw.js` with `Cache-Control: no-cache`, so a fix reaches readers on their next visit.

If it ever misbehaves, switch it off for everyone by replacing `public/sw.js` with:

```js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
})()));
```

and deploying. Remove the registration in `src/scripts/enhance.ts` (section 8) at the same time.

## Before launch

- Until the domain is bought, build with `SITE_URL=<the address you use>`, so canonical links point at that
  copy. Any host other than `djonko.dev` is noindex automatically. Set `SITE_URL` to the domain at launch.
- Fill in `src/data/site.ts` (LinkedIn, contact email, photo) and `src/data/cv.ts`, then set `published: true`.

## After launch

1. Google Search Console and Bing Webmaster Tools: verify the domain with a DNS TXT record, then submit
   `https://djonko.dev/sitemap-index.xml`.
2. IndexNow: with Cloudflare in front, turn on Crawler Hints (Caching, then Configuration).
3. Optional privacy-friendly analytics: set `PUBLIC_CF_ANALYTICS_TOKEN` (Cloudflare Web Analytics) or
   `PUBLIC_PLAUSIBLE_DOMAIN`. Nothing is loaded when they are empty, and the security policy allows only
   the one you set.

## Security model

- The Content Security Policy is a `<meta>` tag in every page, so it holds on any host. It allows scripts
  only from the site itself (plus the analytics script you switch on), and frames only from YouTube's
  privacy-enhanced domain and Vimeo.
- YouTube and Vimeo players load only when a reader presses play. Until then no request goes to them.
- Servers add HSTS, `X-Frame-Options`, `nosniff`, a strict referrer policy and a locked-down permissions policy.
- The `deploy` user cannot use sudo. CI holds only that user's key.
