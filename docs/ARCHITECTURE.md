# Architecture

How the site is built, rendered and checked. Read before changing code. Content editing does not need any of this.

- [Code map](#code-map)
- [Content pipeline](#content-pipeline) — JSON → validation → `virtual:content` → `useContent()`
- [Rendering (SSG)](#rendering-ssg) — routes, pre-rendering, hydration, `<head>`
- [Deferred bundle loader](#deferred-bundle-loader)
- [content-visibility and scrolling](#content-visibility-and-scrolling)
- [SVG notched frames](#svg-notched-frames)
- [Fonts](#fonts)
- [Images](#images)
- [Analytics and consent](#analytics-and-consent)
- [Build pipeline](#build-pipeline)
- [Validation](#validation)
- [LLM tooling](#llm-tooling)

## Code map

```
index.html                     HTML shell (lang="pl", favicon); vite-react-ssg fills it per route
vite.config.ts                 base (VITE_BASE), BUILD_DATE + SITE_URL defines, content plugin, OUT_DIR, one bundle, SSG options
src/main.tsx                   ViteReactSSG entry; strips /index.html from the URL; empty static-loader manifest
src/routes.tsx                 routes for every language: pages from src/data/pages, /produkt/:slug, 404
src/content/
  schema.ts                    Zod contract (single source of truth; exported to schema/ and docs)
  validate.ts                  loadContent(): read + validate + cross-check + merge translations; translationStatus()
  i18n.ts                      applyOverlay(), missingTranslations(), NOT_TRANSLATABLE
  index.ts                     runtime access: contentFor(locale), useContent(), ContentProvider, localizePath(), fmt()
  virtual.d.ts                 type of the virtual:content module
src/pages/                     PageRenderer (sections + page JSON-LD), ProductPage, NotFound
src/sections/                  Hero, About, Split, ProductGrid, Reviews, Visit, Gallery, Faq, CtaBanner, TextBlock
  registry.tsx                 type → component (typed: every section type must be registered)
  hero/ visit/ parts/          sub-components (Spotlight, Ticker, OpeningHours, hours.ts, MapPanel, ShowcaseImage)
src/components/
  layout/Layout.tsx            ContentProvider per language, theme CSS + frame CSS, auto-detect script, font preloads,
                               skip link, cookie banner, header, footer, ScrollManager (scroll restore, hash focus, page views)
  layout/frame.ts              notched-frame geometry → CSS (--nf-* variables, .nf-hero/.nf-menu/.nf-card)
  layout/header/               Logo, HeaderActions, LanguageSwitcher, MobileMenu (full-screen dialog in the frame)
  layout/footer/Wordmark.tsx   giant SVG wordmark that fills its width
  layout/languages.tsx         language links (switcher, menu, footer)
  layout/RouteError.tsx        error element: reloads once after a failed navigation (stale tab after a redeploy)
  product/                     ProductCard, ProductList, ProductGallery, ProductImage, helpers
  consent/                     CookieBanner, ConsentSettingsButton
  Seo.tsx                      <head> per page: title, description, canonical, hreflang, OG/Twitter, JSON-LD
  ui/                          SmartLink, CtaButton/IconLink, Picture, Section/Container/SectionHeading/Sticker, Reveal,
                               AiBadge, icons
  LogoLoop, CurvedLoop, BounceCards, Magnet, StickerPeel, ShinyText   React Bits (free registry)
src/lib/
  links.ts                     resolveHref(): @tokens, language prefix, trailing slash, tracking action
  analytics.ts + tracking/     tracking facade, consent store, GA4/GTM/Meta/TikTok transports, lazy loader
  schema-org.ts                JSON-LD builders + siteUrl()/pageUrl()/socialImage()
  notched-shape.ts             SVG path + 9-slice border-image generator
  utils.ts                     cn(), asset()
src/styles/globals.css         @font-face, theme tokens (@theme), base styles, content-visibility, reduced motion
scripts/                       build-time Node scripts (see Build pipeline, LLM tooling)
public/                        copied as-is: .htaccess, favicon, apple-touch-icon, video/, images/ (generated)
```

Path alias `@/` = `src/` (tsconfig + vite). `tsconfig.json` includes `src`, `scripts` and `vite.config.ts`, so
`npm run typecheck` covers the scripts too.

## Content pipeline

1. `scripts/vite-plugin-content.ts` serves the module `virtual:content`. On load it calls `loadContent()`
   (`src/content/validate.ts`); any error fails `vite build` and shows an overlay in `vite dev`. Every content file is a
   watched file; a change (or a new page file) triggers a full reload without restarting the dev server.
2. `loadContent()` reads `site.json`, `products.json`, `reviews.json`, `pages/*.json` and `src/generated/images.json`,
   parses them with the Zod schemas (defaults filled in), runs the cross-reference checks, then builds every language:
   for each non-default locale it merges `src/data/i18n/<locale>/…` onto the Polish data with `applyOverlay()` and parses
   the result again. Output: `{ site, catalog, reviews, pages, images, defaultLocale, locales: { pl, en, ru, uk } }`.
3. The plugin inlines that object as JSON into the bundle. Zod never ships to the browser; all languages ship in the one
   bundle (content size adds to the JS size — keep texts reasonable).
4. Components read it only through `src/content/index.ts`:
   - `useContent()` → the `Localized` content of the current page's language (`ContentProvider` in `Layout` picks it with
     `localeFromPath(pathname)`): `site`, `catalog`, `pages`, `products`, `getProduct()`, `getPage()`, `productsFor()`,
     `formatPrice()` (respects `catalog.showPrices`, `Intl` in the page language), `localize()`, `lang`, `locale`.
   - `contentFor(locale)` for code outside React (routes, analytics, links default).
   - `localizePath()`, `stripLocale()`, `localeFromPath()`, `fmt()` (fills `{placeholders}` of UI texts), `images`.

## Rendering (SSG)

- **vite-react-ssg 0.9** (React Router 6 data routes). `src/routes.tsx` builds, for every locale: one route per page file
  (`""` index for `/`, `en/`, `ru/`…), `produkt/:slug` with `getStaticPaths()` from the products and a `404` page
  (`404`, `en/404`, …); plus a catch-all `*` (client-side unknown URLs).
  All under one root route whose element is `Layout` and whose `errorElement` is `RouteError`.
- `vite-react-ssg build` builds the client bundle and an SSR bundle, renders every path to `dist/<path>/index.html`
  (`dirStyle: 'nested'`), writes `static-loader-data/` (unused: `main.tsx` sets an empty manifest so client navigation
  never fetches it) and inlines critical CSS with **beasties** (`ssgOptions.beastiesOptions`, fonts not inlined).
- One client bundle: `rolldownOptions.output.codeSplitting: false` — a chunk whose imported chunk name changed was not
  re-hashed, which would have broken the year-long immutable cache of `/assets/`.
- `<head>`: `Head` from `vite-react-ssg` (react-helmet-async). `Layout` → `ThemeStyle` writes `<html lang>`, the theme
  CSS variables + frame CSS, `theme-color`, the auto-detect script and the display-font preloads; `Seo.tsx` writes title,
  description, robots, canonical, hreflang, OG/Twitter and JSON-LD per page.
- **SSR rules:** components must render identically on the server and the client: no `window`, `document`, `Date.now()`
  or `localStorage` during render — use `useEffect`. Client-only UI (cookie banner, "open now", carousel measurements)
  appears after mount. All text content is in the pre-rendered HTML.
- **Hydration:** the browser shows the pre-rendered HTML (links work without JS); the bundle hydrates it after the first
  paint (next section). Client navigation then works as an SPA (React Router `Link`), with `ScrollManager` handling
  scroll and focus.
- **Auto language detection:** an inline script in `<head>` (Layout → `autoDetectScript`) may redirect the first visit to
  `/en/` etc. before anything paints — see [I18N.md](I18N.md#automatic-language-detection).

## Deferred bundle loader

`scripts/lib/defer-app-script.ts` (applied by `postbuild.ts` to every HTML file) replaces the module `<script>` with a
tiny inline loader and removes `modulepreload` links:

- The bundle is requested after **both** the `load` event and the first contentful paint (3 s fallback), or immediately
  on the first `pointerdown`/`keydown`/`touchstart`/`scroll`. It never competes with the hero image and fonts.
- Until it has run, clicks on tracked links (`a[data-track]`, rendered by `SmartLink`) and on buttons are queued in
  `window.__early` (capture phase). After hydration `replayEarlyClicks()` (`src/lib/analytics.ts`, called from the cookie
  banner's mount effect) reports the queued links (consent rules apply) and re-clicks the last queued button, so the
  menu, carousels, map and cookie settings answer a tap made before hydration.

Consequence for code: anything interactive must degrade gracefully before hydration (native `<details>` for the language
switcher, real links for navigation, buttons that are re-clicked).

## content-visibility and scrolling

- `globals.css`: `main > section ~ section` and the footer get `content-visibility: auto; contain-intrinsic-size: auto
  900px` — off-screen sections are not rendered until they approach the viewport (faster first paint; their lazy images
  do not compete with the hero).
- Placeholder heights would make `#anchor` jumps land wrong, so: `html:has([id]:target)` renders everything on a page
  load with a fragment, and `ScrollManager` (Layout) sets `content-visibility: visible` on all sections before scrolling
  to a hash or restoring a Back/Forward position.
- `ScrollManager` also: restores scroll per history entry, scrolls to `#hash` targets and focuses them
  (`tabindex=-1`), re-aims once after 800 ms if images moved the layout, scrolls to top on new pages, and sends
  `trackPageView` after each route change.
- New sections: keep the `<section>` as a direct child of `<main>` (through `Section`) so these rules apply; give it
  `scroll-mt-24` (already in `Section`).

## SVG notched frames

The design's signature shape — a rounded panel with rectangular notches cut out of its corners (logo top-left, round
buttons + CTA top-right, spotlight card bottom-right), joined by concave fillets — is drawn without JS:

- `src/lib/notched-shape.ts`: `notchedPath(spec)` returns the SVG path of a panel with optional `topLeft`, `topRight`,
  `bottomRight` notches (convex `radius`, concave `fillet`); `bottomBandPath()` the ticker strip; `nineSlice(spec)` builds
  an SVG whose **corner slices contain every curve** and whose edges/middle are straight, and returns it as a CSS
  `border-image` (source, slice, width). Stretched to any size, no radius is distorted.
- `src/components/layout/frame.ts`: `FRAME` = geometry per breakpoint (0 / 768 / 1024 px: inset, radius, fillet, header
  item height, gap, notch widths, spotlight card notch, ticker band). `frameCss(theme.colors)` emits, per breakpoint,
  CSS variables `--nf-inset`, `--nf-r`, `--nf-item`, `--nf-gap`, `--nf-notch-h`, `--nf-left`, `--nf-right`, `--nf-card-w`,
  `--nf-card-h`, `--nf-band`, and the `::before` border-images of `.nf-hero` (brandDeep panel + caramel band), `.nf-menu`
  (menu overlay) and `.nf-card` (spotlight mini card with its own arrow notch). `Layout` injects it once, coloured with
  the theme.
- The header (`Header`, `Logo`, `HeaderActions`) sizes and positions its items with the same `--nf-*` variables, so
  over a hero they sit exactly inside the notches; on pages without a hero the header is a normal bar.
- To change the shape: edit the numbers in `FRAME` / `CARD` (keep header item sizes and notch widths consistent), check
  the hero, the menu and the spotlight card at 375, 768, 1024 and 1440 px.

## Fonts

- Self-hosted, subset WOFF2 in `src/assets/fonts/` built by `scripts/subset-fonts.sh` (fonttools `pyftsubset`) from the
  `@fontsource` packages: Anton (display) latin + Polish letters, Manrope Variable (body) latin + Polish letters + Cyrillic,
  and `display-cyrillic.woff2` — Sofia Sans Extra Condensed ExtraBold registered under the family name `Anton` (Anton has
  no Cyrillic) with `size-adjust: 118%`.
- `globals.css` declares them with `unicode-range`, so a page downloads only the files whose letters it uses (Polish
  pages never fetch Cyrillic). `font-display: swap`.
- `Layout` preloads the display font of the LCP headline (Anton latin + Polish; the Cyrillic stand-in on languages in
  its `CYRILLIC` list). `postbuild.ts` removes every other font preload vite-react-ssg adds.
- Tailwind tokens: `font-display` (`--font-display: 'Anton', Impact, 'Arial Narrow', sans-serif`), `font-sans`
  (`'Manrope Variable', system-ui…`). The footer `Wordmark` uses Anton advance widths.

## Images

`scripts/process-images.mjs` (`npm run images`) turns `assets/images/<group>/<name>.(jpg|jpeg|png|webp)` into WebP
widths 480/600/720/960/1600 (≤ original) under `public/images/`, a 1200×630 JPG for `og/` images, a `-og.jpg` on the
cream background for transparent images, and the manifest `src/generated/images.json` (`width`, `height`, `widths`,
`alpha`). `Picture` renders `<img srcset sizes width height>` from the manifest (intrinsic size → no layout shift;
`priority` → eager + `fetchpriority=high`, used only by the hero). `alpha` decides cut-out vs photo styling;
`socialImage()` picks the og image. `asset()` prefixes `VITE_BASE`.

## Analytics and consent

Components call only `src/lib/analytics.ts` (`trackAction`, `trackPageView`, `trackViewItem`, `trackViewItemList`,
`trackSelectItem`, `trackEngagement`); `SmartLink` tracks `@token` links automatically. `tracking/events.ts` drops every
event without consent, fans out to dataLayer/GA4/Meta/TikTok with one `event_id`, re-sends the current page's page view
and item views once consent is given, and keeps landing campaign parameters in memory. Vendor scripts load only after
consent and only when idle or on first interaction (`tracking/loader.ts`). Consent Mode v2 defaults are pushed before any
tag. `page_view` carries `page_language`; product names in events stay Polish. Full flow and event table:
[TRACKING.md](TRACKING.md).

## Build pipeline

`npm run build` =

1. `npm run content:check` → `scripts/validate-content.ts` (`loadContent()` + consent/vendor check) and
   `scripts/export-schema.ts --check` (`schema/` up to date).
2. `vite-react-ssg build` → client bundle + SSR render of every route into `dist/` (or `OUT_DIR`).
3. `scripts/postbuild.ts` (reads `SITE_URL`, `VITE_BASE`, `NOINDEX` from the shell or `.env`/`.env.local`):
   - tidies `<head>` (charset first, only the Layout font preloads), applies the deferred loader, removes `dist/.vite`;
   - `NOINDEX=1` (preview): adds `noindex` to every page, no `sitemap.xml`;
   - turns the pre-rendered `404` route of every language into `404.html` / `<lang>/404.html` (`noindex`) and removes the
     `/404/` folders; warns when `.htaccess` has no matching `ErrorDocument` line;
   - checks every page: title/description present and not too long, unique titles per language, one `<h1>`, JSON-LD
     (parses, required properties, links into the build, no review markup), social meta, `<html lang>` of its language,
     no internal links into another language, canonical = its URL, hreflang complete and reciprocal; warns about a missing
     NIP in the privacy policy, og:images missing from the build, `SITE_URL` not matching `VITE_BASE` (full list:
     [SEO.md → Build checks](SEO.md#build-checks));
   - writes `sitemap.xml` (indexable pages with hreflang alternates, no `lastmod`), `robots.txt`, `llms.txt`
     (Markdown summary of the business for AI search engines).
   Errors exit 1 (the deploy stops); warnings are printed.

Parallel/private builds: `OUT_DIR=.tmp/<name>/dist npx vite-react-ssg build && OUT_DIR=.tmp/<name>/dist npx tsx
scripts/postbuild.ts`. `SOURCEMAP=1` adds source maps for bundle analysis.

## Validation

All editors hit the same rules because they all call `loadContent()`: the Vite plugin (dev + build), `npm run
content:check`, the MCP server, `npm run ai`, and `postbuild.ts`. Rule list: [CONTENT-REFERENCE.md → Validation
rules](CONTENT-REFERENCE.md#validation-rules-beyond-the-schema). Generated artefacts that must stay in sync with
`schema.ts`: `schema/*.json` + `schema/README.md` (`npm run content:schema`, enforced by `content:check`) and the field
tables of `docs/CONTENT-REFERENCE.md` (`npm run docs:reference`, check with `-- --check`).

## LLM tooling

- `scripts/lib/content-store.ts`: whitelist of editable files (`site.json`, `products.json`, `pages/<name>.json`,
  `i18n/<locale>/…`; `reviews.json` read-only; no symlinks/traversal), house JSON formatting, transactional `commit()`
  (write → `loadContent()` → roll back on new errors), JSON Schema export, section catalogue, translation report and rules.
- `scripts/content-mcp.ts`: MCP stdio server over that store. `scripts/ai-edit.ts`: CLI that sends the "Content editing
  rules" section of `AGENTS.md` + schemas + content to an LLM and applies its JSON Patches (repair rounds, backups).
  `.github/workflows/ai-edit.yml` runs the CLI and opens a pull request.
- Keep the "Content editing rules" section of `AGENTS.md` self-contained: it is extracted verbatim (up to the next `## `
  heading) into the CLI's system prompt.
