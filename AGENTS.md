# AGENTS.md — SŁODKO MI website

Entry point for any coding agent or LLM (Claude Code, Codex, Cursor, Copilot, Gemini CLI, Aider…). `CLAUDE.md` imports
this file. Read it fully before editing; open the linked docs only for the task at hand.

**What it is:** a static landing site + flavour catalogue for **Słodko Mi Smakuje Ci?**, a cinnamon-roll bakery in
Poznań-Wilda (ul. 28 Czerwca 1956 r. 177/13, entrance from ul. Hetmańska). Polish at `/`, translations at `/en/`, `/ru/`,
`/uk/`. Every text, link, image, flavour, opening hour, SEO tag and the order of page sections is **data in
`src/data/**/*.json`**, validated at build time. Most requests ("change the hours", "add a flavour", "move the FAQ up",
"translate the new text") are JSON edits, not code changes.

## Docs

| Doc | Read it when you… |
| --- | --- |
| [docs/RECIPES.md](docs/RECIPES.md) | do a common task: step-by-step edits and commands (hours, phone, sections, flavours, prices, colours, pages, languages, photos, reviews, pixels, deploy, domain) |
| [docs/CONTENT-REFERENCE.md](docs/CONTENT-REFERENCE.md) | need any field of any content file, section examples, link tokens, image rules, UI texts, theme colours |
| [docs/I18N.md](docs/I18N.md) | touch translations or add a language |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | change code: rendering, loader, frames, fonts, analytics, build, validation |
| [docs/DEPLOY.md](docs/DEPLOY.md) | deploy, set the domain, configure GitHub secrets/variables |
| [docs/SEO.md](docs/SEO.md) | work on titles, structured data, sitemap, local SEO |
| [docs/TRACKING.md](docs/TRACKING.md) | touch analytics, pixels or the cookie banner |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | hit a validation or build error |
| [docs/LLM-EDITING.md](docs/LLM-EDITING.md) | (owner, Russian) edit with MCP, `npm run ai`, the GitHub Action or a chat |
| [docs/SEO-KEYWORDS.md](docs/SEO-KEYWORDS.md) | write titles/descriptions/copy: keyword map per language and page |
| [schema/README.md](schema/README.md), `schema/*.json` | want the raw JSON Schemas (generated) |

## Golden rules

1. **Content is JSON, not components.** Texts, links, images, flavours, hours, prices, SEO, navigation, colours and
   section order live in `src/data/`. Never hardcode them in `.tsx`.
2. **Links use tokens** (`@order`, `@phone`, `@directions`, `@instagram`, `@facebook`, `@reviews`, `@writeReview`) or
   internal paths; components render links only through `SmartLink` / `CtaButton` / `IconLink`.
3. **Images go through the pipeline:** source file in `assets/images/<group>/<name>.(jpg|png|webp)` → `npm run images` →
   use the key `"<group>/<name>"`. Never a URL or a file path in content. AI pictures carry `"aiGenerated": true`.
4. **Translations are text-only overlays** in `src/data/i18n/<locale>/`. Structure, links, images, prices and settings
   exist only in the Polish files. See [docs/I18N.md](docs/I18N.md).
5. **Validate every change:** `npm run content:check` after content edits; `npm run typecheck && npm run build` after code
   edits. Never leave the repo in a state where the build fails.
6. **Never invent facts.** Prices, ingredients, allergens, kcal, weights, hours, payment methods, awards, phone, address,
   reviews and ratings come only from the owner or the sources below. Unknown = leave the field empty and ask.
7. **Keep Lighthouse ≥ 95** in every category on mobile: no heavy libraries, images only through `<Picture>`, all text in
   the pre-rendered HTML, no layout shift.

**Fact sources** (nothing else counts): `src/data/site.json`, `src/data/products.json`, `src/data/reviews.json`, the
"Sources" paragraph of `docs/SEO-KEYWORDS.md`, the owner's Google description (7 flavours, coffee served, eat in or take
away), the Oreo description and price (24 zł) from Wolt, and the owner's word that szarlotka and sernik z truskawką are
bestsellers. Still unknown — ask the owner, never guess: allergens and ingredients (except Oreo's ingredients), other
prices, weights, kcal, payment methods, NIP/legal name for the privacy policy, seating/Wi-Fi/dogs/accessibility.

## Stack

- Vite 8, React 19, **vite-react-ssg** 0.9 + React Router 6.30: every route (every language) is pre-rendered to
  `<path>/index.html`; the JS bundle loads after the first paint and hydrates.
- Tailwind CSS 4 (CSS-first, `src/styles/globals.css`); colours come from `site.json → theme.colors`.
- TypeScript strict; Zod 4 at build time only (never shipped to the browser).
- Output: static files in `dist/`, uploaded by FTP to Apache shared hosting; preview on GitHub Pages. **No server runtime.**
- Node `^20.19.0 || >=22.12.0`.

## Project map

```
src/data/                    ← ALL content (edit these)
  site.json                    global: name, contact, address, links, hours, specialHours, nav, header, footer, catalog,
                               theme, seo, consent (cookie banner), ui (interface labels), i18n (languages)
  products.json                categories + products (flavours) → cards and /produkt/<slug>/ pages
  reviews.json                 Google reviews — written only by `npm run reviews:fetch`, never by hand or by an LLM
  pages/<name>.json            one file = one page: path, seo, ordered sections[]
  i18n/<locale>/               translation overlays: site.json, products.json, pages/<name>.json (texts only)
src/content/
  schema.ts                    Zod contract of all content; field descriptions are written for LLMs
  validate.ts                  loadContent(): schemas, cross-references, overlays → every language; translationStatus()
  i18n.ts                      overlay rules (applyOverlay, missingTranslations, NOT_TRANSLATABLE)
  index.ts                     runtime: useContent(), contentFor(locale), localizePath(), fmt()
src/sections/                one component per section type + registry.tsx (type → component)
src/pages/                   PageRenderer (JSON page → sections), ProductPage, NotFound
src/components/              layout (Header, Footer, language switcher, frames), product cards, consent banner, Seo,
                             ui/ primitives (SmartLink, CtaButton, Picture, Section, Reveal, AiBadge), React Bits blocks
src/lib/                     links.ts (@tokens), analytics.ts + tracking/ (consent, pixels), schema-org.ts (JSON-LD),
                             notched-shape.ts (SVG frames), utils.ts
src/styles/globals.css       fonts, theme tokens, content-visibility, focus, reduced motion
src/generated/images.json    image manifest (generated by `npm run images`)
assets/images/<group>/       source photos → public/images/<group>/<name>-<width>.webp
public/                      .htaccess, favicon, video/, images/ (generated)
schema/                      JSON Schemas + section catalogue, generated from schema.ts
scripts/                     validate-content, export-schema, process-images, fetch-google-reviews, postbuild,
                             content-mcp (MCP server), ai-edit (LLM CLI), docs-content-reference, lib/
docs/                        documentation (see the table above); docs/ru/ГАЙД.md — short guide for the owner
.github/workflows/           ci, deploy (FTP + GitHub Pages), reviews (weekly), ai-edit
```

## Where content lives

| What | File → key |
| --- | --- |
| Name, tagline, description, logo wordmark | `site.json` → `name`, `legalName`, `tagline`, `description`, `logo` |
| Phone, e-mail | `site.json` → `contact` (`phone` in E.164 + `phoneDisplay`) |
| Address, entrance hint, map pin | `site.json` → `address` |
| Wolt, Google Maps, reviews, Instagram, Facebook, map embed | `site.json` → `links` (targets of the `@tokens`) |
| Opening hours, holidays, one-off changes | `site.json` → `hours`, `specialHours`, `hoursNote` |
| Menu, header button, footer | `site.json` → `nav`, `header.cta`, `footer` |
| Show/hide prices, product page buttons | `site.json` → `catalog` |
| Brand colours | `site.json` → `theme.colors` |
| Default SEO, social image, cookie banner texts | `site.json` → `seo`, `consent` |
| Interface labels (product page, 404, reviews, visit, menu, days, allergen names…) | `site.json` → `ui` (optional; Polish defaults in `schema.ts`) |
| Languages, auto-detection | `site.json` → `i18n` |
| Flavours: name, descriptions, price, allergens, photos, badge, SEO snippet | `products.json` → `products[]`, `categories[]` |
| Page texts, section order, page `<title>`/description | `pages/<name>.json` → `sections[]`, `seo` (home = `home.json`, path `/`) |
| Google rating, review count, review texts | `reviews.json` (automatic, read-only) |
| Any text in English / Russian / Ukrainian | `i18n/<locale>/` + same file name and key path as the Polish file |

## Content editing rules

<!-- Sent verbatim to the model by `npm run ai` (scripts/ai-edit.ts) — keep this section self-contained. -->

1. **Content is JSON.** Change texts, links, images, products, hours, prices, SEO, navigation, footer, theme colours and the
   order/presence of sections only in `src/data/**/*.json` — never in components.
2. **Validate after every edit:** `npm run content:check` (also runs before every build). The contract is `src/content/schema.ts`,
   readable as JSON Schema in `schema/*.json` and field by field in `docs/CONTENT-REFERENCE.md`. Only fields from the schema are
   allowed — an unknown or misspelled key (`"visible"`, `"hidden"`) is an error, not ignored.
3. **Languages:** the files in `src/data/` (outside `i18n/`) are Polish — natural, concise Polish even when the instruction is in
   Russian. Translations live in `src/data/i18n/<locale>/` (`en`, `ru`, `uk`) and are written in that language. Keep the brand
   voice: warm, playful, local ("TEJ, czas na cynamonkę"). Plain text only — no HTML or Markdown inside strings.
4. **Never invent facts.** Prices, ingredients, allergens, weights, kcal, opening hours, payment methods, awards, phone, address,
   URLs, reviews and ratings come from the owner. If a value is not given, keep the existing one or leave the optional field out.
5. **One place per fact.** Address, phone, hours and external URLs live in `site.json`. When one changes, search all files —
   translations included — for texts that repeat it (FAQ answers, intros, SEO descriptions, privacy policy) and update them too.
6. **Links:** prefer tokens — `@order` (Wolt), `@phone`, `@directions`, `@instagram`, `@facebook`, `@reviews`, `@writeReview`.
   They resolve from `site.json` and are tracked automatically. Internal links: `/`, `/<page-path>`, `/#<section-id>`,
   `/produkt/<slug>` (written without a language prefix — every language version gets its own prefix automatically). The target
   page, section id or product must exist, and the section must be enabled. `site.json` and `products.json` are shown on every
   page, so they always use `/#id`, never a bare `#id`.
7. **Images:** `src` is an image key from `src/generated/images.json` (e.g. `products/oreo`, `photos/zespol`, `cutouts/szarlotka`),
   never a file path or URL; `alt` describes the picture in the file's language. Only use keys that exist. New photo → put the file
   in `assets/images/<group>/<name>.(jpg|png|webp)` and run `npm run images` (MCP: `add_image`). Cut-out PNG/WebP with
   transparency works best for products and hero. AI-generated pictures get `"aiGenerated": true` (visible „Ilustracja” label) —
   never present them as real photos.
8. **Page structure:** a page is `src/data/pages/<name>.json` with `path`, `seo` and an ordered `sections[]`. Reorder sections by
   moving array items; hide one with `"enabled": false` (prefer this to deleting — and change or remove every link to it, e.g.
   `nav`/footer items, in the same edit: links to hidden sections fail validation); add one by inserting an object of an existing
   `type`. Section `id`s are unique per page, lowercase with dashes, and double as `#anchors` — update links when renaming, and
   rename the same `id` in the translation files. A new file in `src/data/pages/` becomes a new route in every language; link it
   from `nav` or the footer if visitors should find it. Paths starting with `/produkt` are reserved for products.
9. **Headings:** every page starts with a `hero` or a `text` section with a `heading` — that is the page's only `<h1>`.
   Use at most one `hero` per page.
10. **Products:** `slug` is the URL (`/produkt/<slug>`); renaming it breaks links — update every reference, translations included.
    `category` must exist in `categories`. `price` is PLN or `null` (all prices are hidden while `site.catalog.showPrices` is
    false). `allergens` use the EU list in Polish. `featured: true` feeds `productGrid` sections with `source.mode = "featured"`.
    Array order = display order. Optional `seo.title` (≤ 48 characters, the template adds " | Słodko Mi") and `seo.description`
    (≤ 155) set the product page's search snippet.
11. **Reviews:** `reviews.json` is refreshed from Google by `npm run reviews:fetch` (weekly GitHub Action) and is read-only for the
    LLM tools. Never write, edit, translate or invent review texts, ratings or counts. Keep the reviews section's `notice` (source of
    the reviews and that they are not verified — required by EU consumer law).
12. **SEO:** `seo.title` ≤ 60 characters including the " | Słodko Mi" suffix (so ≤ 48 of your own), `seo.description` ≤ 155
    characters, unique per page and language. Use the keyword map in `docs/SEO-KEYWORDS.md`.
13. **Theme:** `theme.colors` must keep WCAG AA contrast (checked by the build: `brandDeep` and `ink` ≥ 4.5:1 on `cream`/`blush`, `caramel` ≥ 4.5:1 on `brandDeep`,
    `brand` ≥ 3:1 on `cream`, …); `brand` is for large display text only.
14. **Minimal diffs:** change only what the request needs; keep `$schema` and the existing formatting (2 spaces).
15. **Hours:** `hours` holds the regular week. A holiday, closure or changed hours on a date goes to `specialHours`
    (`{"date": "YYYY-MM-DD", "closed": true}` or `{"date": …, "opens": "HH:MM", "closes": "HH:MM"}`, optional `note`), not only
    into `hoursNote`; the site shows dates of the next 14 days and uses them for „Otwarte teraz”. `closes` must be later than
    `opens`; midnight is `"00:00"`. Remove past dates when editing hours. Texts that repeat the hours (FAQ, intros) must match.
16. **Interface labels** (buttons, headings and notes that are not section content) live in `site.json` → `ui`. Every key has a
    Polish default; add only the keys that should change. `ui.product.otherProductsHeading: ""` hides „Inne smaki”. The word
    „Google” in the review attribution („Opinie z Google”, „… opinii w Google”) and the Google logo are fixed in code (Google's
    attribution requirement).
17. **Translations** (`src/data/i18n/<locale>/site.json`, `products.json`, `pages/<name>.json`) contain ONLY texts, at the same key
    paths as the Polish file. Items of `sections`, `products`, `categories` and `specialHours` are matched by `id`/`slug`/`date`
    (each translated item must contain it); other arrays (headline lines, paragraphs, FAQ items, nav links, footer columns,
    images) are matched by position, so keep their order identical to the Polish file. Never put links, image keys,
    numbers, true/false, hours, `tone`, `type`, `variant`, `legalName`, `wordmark` or anything under site `links`, `theme`,
    `i18n`, `hours`, `contact`, `address.geo`, product `allergens` or section `source` into a translation (rules:
    docs/I18N.md). When a Polish text changes, update the same
    path in every translation (an outdated translation is not reported as missing). A text missing from a translation shows in
    Polish.

## Adding a new section type (code change)

Only when no existing type can express the request. Full walkthrough with code: [docs/RECIPES.md → "Add a new section
type"](docs/RECIPES.md#add-a-new-section-type-code). In short: Zod schema in `src/content/schema.ts` (strict, every field
described) + add it to the `Section` union → extra cross-checks in `validate.ts` if it references products/categories →
component `src/sections/X.tsx` from the shared primitives → register it in `src/sections/registry.tsx` → technical string
fields go into `NOT_TRANSLATABLE` (`src/content/i18n.ts`) → `npm run content:schema && npm run docs:reference` → use it in
a page → `npm run content:check && npm run typecheck && npm run build`.

## Commands

| Command | What it does |
| --- | --- |
| `npm ci` | Install exactly the locked dependencies (first run, CI) |
| `npm run dev` | Dev server at http://localhost:5173 with hot reload (content errors show as an overlay) |
| `npm run content:check` | Validate all content and translations + check that `schema/` is up to date |
| `npm run i18n:status` | Translation completeness per language and file (`-- en --missing` lists the missing texts with their paths) |
| `npm run i18n:check` | Same, exit 1 while texts are missing (CI runs it as a warning) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | content:check → pre-render every route into `dist/` → postbuild (head tidy, 404.html, SEO/hreflang checks, sitemap, robots, llms.txt) |
| `npm run preview` | Serve `dist/` at http://localhost:4173 |
| `npm run content:schema` | Regenerate `schema/*.json` and `schema/README.md` after changing `src/content/schema.ts` |
| `npm run docs:reference` | Regenerate the field tables of `docs/CONTENT-REFERENCE.md` from the schema (`-- --check` only verifies) |
| `npm run images` | `assets/images/**` → responsive WebP (+ social JPG) in `public/images/` + `src/generated/images.json` |
| `npm run reviews:fetch` | Refresh `reviews.json` from Google Places (needs `GOOGLE_PLACES_API_KEY`; `-- --dry-run` writes nothing) |
| `npm run ai -- "…"` | Edit content with any LLM (`--dry-run`, `--yes`, `--build`, `--prompt`, `--response <file>`) |
| `npm run mcp` | Start the MCP content server on stdio (normally started by the MCP client) |

Private build next to other people's work (never touches `dist/`):
`OUT_DIR=.tmp/<name>/dist npx vite-react-ssg build && OUT_DIR=.tmp/<name>/dist npx tsx scripts/postbuild.ts`, then
`npx vite preview --outDir .tmp/<name>/dist --port <port>`; delete `.tmp/<name>` afterwards.

## LLM tooling

- **MCP server `slodkomi-content`** (`scripts/content-mcp.ts`, registered in `.mcp.json`): `list_content`, `get_schema`,
  `read_content`, `write_content`, `patch_content` (RFC 6902), `delete_page` (with its translations), `translation_status`,
  `validate_content`, `list_images`, `add_image`, `build_site`. Writes are whitelisted (`src/data/site.json`,
  `products.json`, `pages/<name>.json`, `i18n/<locale>/…`; `reviews.json` is read-only; no symlinks), validated with
  `loadContent()` and rolled back automatically when they introduce errors.
- **CLI `npm run ai`** (`scripts/ai-edit.ts`): Anthropic or any OpenAI-compatible API; the model gets the "Content editing
  rules" above, the translation rules, the JSON Schemas and the content (Polish + translations; an instruction about
  translating also gets the missing texts and the keyword map of that language), answers with JSON Patches that are
  applied, validated and repaired (up to 3 rounds); backups in `.ai-edit-backup/`.
- **GitHub Action "AI edit"** (`.github/workflows/ai-edit.yml`): instruction typed on github.com/phone → pull request → merge →
  deploy.
- Setup and usage for each: [docs/LLM-EDITING.md](docs/LLM-EDITING.md).

## Code conventions

- **Performance:** Lighthouse ≥ 95 in every category, mobile-first. Minimal client JS; images only through `<Picture>` with
  accurate `sizes` (only the hero image is `priority`); explicit dimensions, no layout shift. No heavy animation libraries
  (motion, gsap, three). Off-screen sections rely on `content-visibility` (see ARCHITECTURE).
- **Static only:** plain files on Apache — no API routes, no request-time rendering, no secrets in client code (`VITE_*`
  variables are public).
- **SSR-safe:** no `window`/`document` at module scope or during render; client-only values in `useEffect`. All text must be in
  the pre-rendered HTML.
- **i18n-safe:** read content with `useContent()` (the page's language), never by importing JSON; internal links through
  `SmartLink`/`c.localize()`; dates and numbers with `Intl` and `useContent().lang`.
- **Accessibility:** semantic HTML, one `<h1>` per page, keyboard access, visible focus, `aria-label` on icon-only controls,
  touch targets ≥ 44 px, WCAG AA contrast, `prefers-reduced-motion` respected.
- **Shared building blocks:** links through `SmartLink`/`CtaButton`/`IconLink` (never a raw `<a>` for content links); tracking
  only through `src/lib/analytics.ts` (never `gtag`/`fbq`/`ttq`; see `docs/TRACKING.md`); `cn()`/`asset()` from `src/lib/utils.ts`.
- **Theme tokens:** `bg-cream`, `text-ink`, `brand` (large text/decoration only), `brand-deep` (buttons, small coloured text),
  `blush`, `caramel`, `font-display` (Anton, uppercase), `font-sans` (Manrope), `rounded-frame`. Never raw hex in components.
- **Copy:** visible interface texts belong in `site.json → ui` (Polish default in `schema.ts`), not in components; aria-labels
  and screen-reader-only texts too; business facts never in code.
- **React Bits:** `LogoLoop`, `CurvedLoop`, `BounceCards`, `Magnet`, `StickerPeel`, `ShinyText` come from the free `@react-bits`
  shadcn registry (`components.json`). `@reactbits-starter` / `@reactbits-pro` need `REACTBITS_LICENSE_KEY` (see RECIPES).
- **Style:** 2-space indent, single quotes, no semicolons, small focused components, comments only where they add context.
- Never commit `dist/`, `.env*`, `.ai-edit-backup/`, `.tmp/`.

## Deploy

Push to `main` → `.github/workflows/deploy.yml` builds and uploads `dist/` by FTP (secrets `FTP_SERVER`, `FTP_USERNAME`,
`FTP_PASSWORD`, variable `SITE_URL`) and publishes a `noindex` preview on GitHub Pages (`/SLODKO-MI/`). Pull requests are
checked by `ci.yml`. Details: [docs/DEPLOY.md](docs/DEPLOY.md).
