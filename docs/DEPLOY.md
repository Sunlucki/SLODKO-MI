# Deploy

The site is plain files: `npm run build` writes `dist/`, which any static host can serve. Production: **Apache/LiteSpeed
shared hosting via FTP**. Preview: **GitHub Pages**. Both are published by `.github/workflows/deploy.yml` on every push
to `main`.

- [Overview](#overview)
- [GitHub setup (secrets and variables)](#github-setup-secrets-and-variables)
- [Environment variables](#environment-variables)
- [FTP deploy (production)](#ftp-deploy-production)
- [Manual deploy](#manual-deploy)
- [Sub-folder deploy (next to WordPress)](#sub-folder-deploy-next-to-wordpress)
- [`.htaccess`](#htaccess)
- [GitHub Pages preview](#github-pages-preview)
- [After a deploy](#after-a-deploy)
- [Rollback](#rollback)

## Overview

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` (CI) | every pull request, pushes to branches other than `main` | `npm ci` → `content:check` → `i18n:check` (warning only) → `typecheck` → `build` |
| `deploy.yml` (Deploy) | push to `main`, manual run, after "Refresh Google reviews" | job `build-ftp` (if `FTP_SERVER` is set): build with `SITE_URL` + pixel IDs → upload `dist/` by FTP; job `pages`: noindex preview build → GitHub Pages |
| `reviews.yml` (Refresh Google reviews) | Mondays 05:17 UTC, manual | `reviews:fetch` → `content:check` → commit `reviews.json` (+ `site.json` write-review link) to `main` → triggers Deploy |
| `ai-edit.yml` (AI edit) | manual (instruction) | `npm run ai` → build → translation status → pull request |

## GitHub setup (secrets and variables)

Settings → Secrets and variables → Actions.

| Name | Kind | Used by | Required | Value |
| --- | --- | --- | --- | --- |
| `FTP_SERVER` | secret | deploy | for FTP | FTP host, e.g. `ftp.example.pl` (unset = FTP job skipped) |
| `FTP_USERNAME` | secret | deploy | for FTP | FTP login |
| `FTP_PASSWORD` | secret | deploy | for FTP | FTP password |
| `FTP_SERVER_DIR` | secret | deploy | no | target folder, default `./public_html/` (sub-folder: `./public_html/slodkomi/`) |
| `SITE_URL` | variable | deploy | for FTP | production URL without trailing slash, e.g. `https://example.pl` |
| `VITE_BASE` | variable | deploy | no | sub-path, default `/` (sub-folder: `/slodkomi/`) |
| `FTP_PROTOCOL` | variable | deploy | no | `ftps` (default) or `ftp` |
| `VITE_GA_ID`, `VITE_META_PIXEL_ID`, `VITE_GTM_ID`, `VITE_TIKTOK_PIXEL_ID` | variable or secret | deploy (FTP build only) | no | tracker IDs (see TRACKING.md); variable wins over secret |
| `GOOGLE_PLACES_API_KEY` | secret | reviews | no | Places API (New) key (unset = weekly refresh skipped) |
| `GOOGLE_PLACE_ID` | variable | reviews | no | place id (saves a search request) |
| `LLM_API_KEY` | secret | ai-edit | for AI edit | Anthropic or OpenAI-compatible key |
| `LLM_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL` | variable | ai-edit | no | see LLM-EDITING.md |

Also: Settings → Pages → Source: **GitHub Actions** (preview), and Settings → Actions → General → Workflow permissions →
"Allow GitHub Actions to create and approve pull requests" (AI edit).

## Environment variables

Read from the shell first, then `.env.local` / `.env` (Vite `loadEnv`; `.env.example` lists them). `VITE_*` values are
**public** — they end up in the browser bundle; never put secrets there.

| Variable | Read by | Effect |
| --- | --- | --- |
| `SITE_URL` | `vite.config.ts`, `postbuild.ts` | origin (+ path) of canonical URLs, `og:url`, hreflang, JSON-LD, sitemap, robots, llms.txt. Unset → `site.json → url` (with a warning) |
| `VITE_BASE` | `vite.config.ts`, `postbuild.ts` | public path of the build (`/` or `/slodkomi/`); its path must equal the path of `SITE_URL` (else the build fails) |
| `NOINDEX=1` | `postbuild.ts` | preview build: every page `noindex`, no `sitemap.xml`, `robots.txt` without sitemap |
| `OUT_DIR` | `vite.config.ts`, `postbuild.ts` | output folder (default `dist`) — for private/parallel builds |
| `SOURCEMAP=1` | `vite.config.ts` | emit source maps (bundle analysis) |
| `VITE_GA_ID`, `VITE_META_PIXEL_ID`, `VITE_GTM_ID`, `VITE_TIKTOK_PIXEL_ID` | build, `content:check` | enable trackers; the vendor must be named in the consent texts |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` | `reviews:fetch` | Google reviews refresh |
| `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` | `npm run ai` | LLM provider |
| `REACTBITS_LICENSE_KEY` | shadcn CLI (`components.json`) | paid React Bits registries |

## FTP deploy (production)

1. Set the secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (+ `FTP_SERVER_DIR` if the web root is not
   `public_html/`) and the variable `SITE_URL`.
2. Push to `main` (or Actions → Deploy → Run workflow).
3. Job `build-ftp`: checks `SITE_URL` (fails with "Set the repository variable SITE_URL…" if missing) → `npm ci` →
   `npm run build` with `SITE_URL`, `VITE_BASE` and the tracker IDs → `SamKirkland/FTP-Deploy-Action` uploads `./dist/`.
   It uploads only changed files and deletes files it uploaded earlier that are gone now (old hashed assets); its state
   lives in `.ftp-deploy-sync-state.json` on the server — do not delete it (or the next run re-uploads everything).

Production builds have no `noindex`; only the GitHub Pages preview has.

## Manual deploy

```bash
npm ci
SITE_URL=https://example.pl npm run build     # or put SITE_URL (and the pixel IDs) into .env.local
```

Upload the **contents** of `dist/` (not the folder itself) into `public_html/`, including the hidden `.htaccess`
(enable "show hidden files" in the FTP client). Re-uploading everything is fine; remove old files in `assets/` from time
to time.

## Sub-folder deploy (next to WordPress)

When the site must live at `https://example.pl/slodkomi/`:

1. Build with `VITE_BASE=/slodkomi/` and `SITE_URL=https://example.pl/slodkomi` (GitHub: variables `VITE_BASE`, `SITE_URL`,
   secret `FTP_SERVER_DIR=./public_html/slodkomi/`).
2. In `public/.htaccess` (before building) change every `ErrorDocument` path to `/slodkomi/…` (also inside the language
   `<If>` blocks: `m#^/slodkomi/en/#` and `/slodkomi/en/404.html`, same for `ru`, `uk`) and set `RewriteBase /slodkomi/`.
   The build warns when an `ErrorDocument` does not match `VITE_BASE`.
3. Upload `dist/` into `public_html/slodkomi/`. WordPress' `.htaccess` in `public_html/` does not interfere (its rules skip
   existing files; the deeper `.htaccess` wins for `/slodkomi/`).

## `.htaccess`

`public/.htaccess` is copied into `dist/`. Every route is a real `<path>/index.html` — there is no SPA fallback.

- `Options -Indexes -MultiViews` (delete this line if the host answers 500), `DirectoryIndex index.html`,
  `DirectorySlash On` (`/produkt/oreo` → `/produkt/oreo/`, matching canonical URLs).
- **404 per language:** missing URLs under `/en/`, `/ru/`, `/uk/` get `/<lang>/404.html` (in `<If>` blocks), everything else
  `/404.html` (Polish); 403 (folders without index) shows the 404 page too. A new language needs one more `<If>` block.
- **Redirects (one 301 hop):** `.well-known/` stays reachable over http (certificates); `…/index.html` → folder URL;
  folder without trailing slash → `https://<host without www>/…/`; `www.` → bare domain; http → https (also behind a TLS
  proxy via `X-Forwarded-Proto`). So `SITE_URL` must be the bare `https://` domain; to prefer `www.`, change these rules.
- **MIME types**, **Brotli/Deflate** compression (guarded by `mod_filter`).
- **Caching:** HTML/XML/TXT/JSON `no-cache` (new deploys visible immediately); `/assets/*` JS/CSS/fonts one year
  `immutable` (hashed names — never put un-hashed `.js`/`.css` into `public/`); images/video 7 days (stable names: a
  replaced photo with the same key can stay cached in browsers up to a week).
- **Security headers:** `nosniff`, `Referrer-Policy`, `X-Frame-Options SAMEORIGIN`, `Permissions-Policy`. If you add a
  Content-Security-Policy, allow the tracker domains listed in TRACKING.md.

## GitHub Pages preview

Job `pages` builds with `VITE_BASE=/SLODKO-MI/`, `NOINDEX=1` and `SITE_URL` = the variable or
`https://sunlucki.github.io/SLODKO-MI`, without tracker IDs, and publishes to https://sunlucki.github.io/SLODKO-MI/.
Every page is `noindex` and there is no sitemap, so it never competes with production; once `SITE_URL` is set, its
canonical URLs point at production on purpose. GitHub Pages serves `/404.html` for every missing URL (Polish).

Same build locally: [RECIPES.md → Preview on GitHub Pages](RECIPES.md#preview-on-github-pages).

## After a deploy

- Open `/`, `/en/`, a product page, and a missing URL (`/xyz`, `/en/xyz` → 404 in that language).
- `curl -sI https://example.pl/produkt/oreo | head -3` → `301` to `/produkt/oreo/`; `curl -sI http://www.example.pl/` →
  one 301 to `https://example.pl/`.
- `https://example.pl/sitemap.xml`, `/robots.txt`, `/llms.txt` exist and name the production domain.
- Google Search Console: submit the sitemap once (see SEO.md).
- With trackers: `?debug_analytics=1`, accept cookies, watch the console.

## Rollback

`git revert <commit>` (or "Revert" on the merged pull request) and push to `main` — Deploy publishes the previous state.
Manual hosting: rebuild the previous commit (`git checkout <sha> && npm ci && npm run build`) and upload `dist/`.
