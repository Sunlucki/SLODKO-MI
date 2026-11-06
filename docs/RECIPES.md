# Recipes

Step-by-step edits for common tasks. Every recipe ends with a check; when in doubt run
`npm run content:check` (content) or `npm run typecheck && npm run build` (code). Field details:
[CONTENT-REFERENCE.md](CONTENT-REFERENCE.md). Translation rules: [I18N.md](I18N.md). Errors: [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Content recipes**
- [Change a text](#change-a-text)
- [Change opening hours](#change-opening-hours) · [Special hours (holidays, closures)](#special-hours-holidays-closures)
- [Change phone or address](#change-phone-or-address)
- [Add, remove, reorder or disable a section](#add-remove-reorder-or-disable-a-section)
- [Add a product (flavour)](#add-a-product-flavour) — photo, cut-out, Higgsfield
- [Change prices and show prices](#change-prices-and-show-prices)
- [Change colours](#change-colours)
- [Add a page](#add-a-page)
- [Translate missing texts](#translate-missing-texts) · [Add a language](#add-a-language)
- [Replace AI images with real photos](#replace-ai-images-with-real-photos)
- [Refresh Google reviews](#refresh-google-reviews)

**Code and setup recipes**
- [Add a new section type (code)](#add-a-new-section-type-code)
- [Change fonts](#change-fonts)
- [Connect GA4, Meta Pixel, GTM or TikTok](#connect-ga4-meta-pixel-gtm-or-tiktok)
- [Deploy via FTP](#deploy-via-ftp) · [Preview on GitHub Pages](#preview-on-github-pages) · [Set the production domain](#set-the-production-domain-site_url)
- [Edit with MCP, the CLI or the GitHub Action](#edit-with-mcp-the-cli-or-the-github-action)
- [Use React Bits Pro components](#use-react-bits-pro-components-reactbits-starter)
- [Check performance (Lighthouse)](#check-performance-lighthouse) · [Undo a change](#undo-a-change)

---

## Change a text

1. Find it: `grep -rn "part of the text" src/data` (Polish) — the hit tells the file and the key.
   Interface labels that are not in any file come from the defaults in `src/content/schema.ts` → override them in
   `src/data/site.json → ui` (see CONTENT-REFERENCE → Interface texts).
2. Edit the string in place. Plain text, no HTML.
3. Translations: change the same key path in `src/data/i18n/en|ru|uk/<same file>` (search the old translation with
   `grep -rn "…" src/data/i18n`), or delete that entry so `npm run i18n:status` lists it as missing.
4. `npm run content:check`. Look at it: `npm run dev` → http://localhost:5173 (English: `/en/`).

SEO texts: `seo.title` ≤ 48 characters of your own (the template adds " | Słodko Mi"), `seo.description` ≤ 155. Use the
phrases from `docs/SEO-KEYWORDS.md`.

## Change opening hours

File: `src/data/site.json → hours` (one entry per group of days with the same hours; every day at most once).

```json
"hours": [
  { "days": ["Mo"], "closed": true },
  { "days": ["Tu", "We", "Th", "Fr"], "opens": "10:00", "closes": "19:00" },
  { "days": ["Sa", "Su"], "opens": "10:00", "closes": "17:00" }
]
```

1. Edit `hours`. Days: `Mo Tu We Th Fr Sa Su`; times `HH:MM`, 24 h; `closes` later than `opens`; closing at midnight is
   `"00:00"`.
2. Texts that repeat the hours must say the same: `grep -rn -i "10:00\|19:00\|poniedział\|niedziel" src/data` (FAQ
   answers, the visit intro, `hoursNote`) — Polish and translations.
3. `npm run content:check`. The visit section table, "Otwarte teraz", JSON-LD and `llms.txt` update by themselves.
4. Owner: change the hours in Google Business Profile, Wolt and Facebook too.

## Special hours (holidays, closures)

File: `src/data/site.json → specialHours`. One entry per date:

```json
"specialHours": [
  { "date": "2026-11-11", "closed": true, "note": "Święto Niepodległości" },
  { "date": "2026-12-24", "opens": "10:00", "closes": "14:00", "note": "Wigilia" }
]
```

1. Add entries (dates `YYYY-MM-DD`, each date once). Remove dates that have passed.
2. `note` is optional text, translated by date: `src/data/i18n/<locale>/site.json → specialHours` →
   `{ "date": "2026-11-11", "note": "Independence Day" }`. Removing a date: remove it from the overlays too.
3. `npm run content:check`, then deploy (push to `main`).

What happens: the visit section lists special dates of the next 14 days under „Zmiany w godzinach” (counted from today
in the browser; from the build date in the pre-rendered HTML), and "open now" follows them. All entries go into the
JSON-LD (`validFrom`/`validThrough`) and the upcoming ones into `llms.txt`. Put them into Google Business Profile as well.

## Change phone or address

1. `src/data/site.json`:
   - phone: `contact.phone` in E.164 (`"+48511228221"`, used for `tel:` and JSON-LD) **and** `contact.phoneDisplay`
     (`"511 228 221"`, shown).
   - address: `address.street`, `postalCode` (`00-000`), `city`, `district`, `entranceNote`, `geo` (lat/lng of the
     entrance — right-click the spot in Google Maps to copy them).
   - links that contain the address: `links.directions` (route URL, the destination is URL-encoded),
     `links.mapEmbed`, `links.googleMaps`, `links.reviews` — copy the new ones from Google Maps.
2. Texts that repeat them: `grep -rn "177/13\|28 Czerwca\|Hetmańsk\|511 228 221" src/data` — home intro, hero, ticker,
   FAQ, SEO description, privacy policy (controller address and phone), in every language.
3. `npm run content:check`.
4. Owner: same NAP (name, address, phone) everywhere: Google Business Profile, Wolt, Facebook, Instagram, listings
   (see [SEO.md](SEO.md#local-seo-checklist-for-the-owner)).

## Add, remove, reorder or disable a section

File: `src/data/pages/<name>.json → sections` (home page = `home.json`).

- **Reorder:** move the object inside the array. Sections are matched by `id` in translations — nothing else to do.
  The first enabled section must stay the `hero` (or a `text` with `heading`).
- **Disable (hide):** add `"enabled": false`. Then fix links to it — `grep -rn '"/#<id>"\|"#<id>"' src/data` (menu,
  footer, buttons): remove or retarget them in the same edit (validation fails while a link points at a hidden section).
- **Remove:** delete the object; fix links as above; delete the item with that `id` from
  `src/data/i18n/*/pages/<name>.json` (otherwise: `item "<id>" does not exist in the default language`).
- **Add:** insert an object of an existing type (examples for every type in
  [CONTENT-REFERENCE.md](CONTENT-REFERENCE.md#page-files-and-section-types)) with a new unique `id`; use existing image
  keys; add a menu entry in `site.json → nav` (`"href": "/#<id>"`, max 6 items) if needed; translate its texts in each
  `src/data/i18n/<locale>/pages/<name>.json` (`{ "id": "<id>", … }`).
- **Rename an `id`:** change it in the page, in every link (`/#old-id`) and in every translation overlay.

Check: `npm run content:check`, then `npm run dev`.

## Add a product (flavour)

Only with facts from the owner (name, what is on it; price/allergens only if given).

1. **Photos** (file name = the slug, e.g. `pistacja`):
   - `assets/images/products/pistacja.jpg` — square photo on a plate, ~1600×1600 (second image, product gallery).
   - `assets/images/cutouts/pistacja.png` — the same roll with a **transparent background** (card image, product page,
     social preview). Make it with any background remover; the current cut-outs were prepared with **Higgsfield** (web app,
     or its MCP server: `remove_background` on the real photo, then download the PNG into `assets/images/cutouts/`).
     Background removal of a real photo keeps it a real photo (`aiGenerated` stays false). If the tool *generated* or
     redrew the roll (text-to-image, "enhance", outpainting), set `"aiGenerated": true` and start the `alt` with
     "Ilustracja:" — never show an AI picture of a flavour as if it were real.
2. `npm run images` → prints `✓ cutouts/pistacja (…, alpha) → 480, 600, …`, creates `public/images/cutouts/pistacja-*.webp`,
   `public/images/cutouts/pistacja-og.jpg` and the manifest entries.
3. `src/data/products.json → products` — add the object where it should appear (array order = display order):

   ```json
   {
     "slug": "pistacja",
     "name": "Pistacja",
     "category": "cynamonki",
     "price": null,
     "shortDescription": "Jedno zdanie na kartę (≤ 140 znaków).",
     "description": "Pełny opis na stronę produktu — tylko fakty od właściciela.",
     "ingredients": [],
     "allergens": [],
     "images": [
       { "src": "cutouts/pistacja", "alt": "Cynamonka pistacjowa z kremem" },
       { "src": "products/pistacja", "alt": "Cynamonka pistacjowa na białym talerzu" }
     ],
     "available": true,
     "featured": false,
     "badge": "Nowość",
     "seo": { "title": "Cynamonka pistacjowa – Poznań, Wilda", "description": "…" }
   }
   ```

   `allergens` only from the EU list (`gluten`, `jaja`, `mleko`, `orzechy`, `soja`, `sezam`…) and only when the owner gave
   them — the page always shows the "ask the staff" allergy note. `seo` is optional (defaults: `name`,
   `shortDescription`).
4. Texts that count or list the flavours: `grep -rn -i "7 smak\|siedem\|7 wariant" src/data` (FAQ, ticker, sticker, SEO
   description) — update them in Polish and translations. Optionally link it in `site.json → footer` or the hero
   `spotlight.productSlugs`.
5. Translations: add `{ "slug": "pistacja", "name": …, "shortDescription": …, "description": …, "images": [{ "alt": … },
   { "alt": … }] }` to `src/data/i18n/<locale>/products.json → products`.
6. `npm run content:check && npm run build`. The page `/produkt/pistacja/` (and `/en/produkt/pistacja/` …), the card in
   every `productGrid` with `mode: "all"`, the sitemap and `llms.txt` are created automatically.

Remove a flavour: delete it from `products.json` and from the overlays, remove links to `/produkt/<slug>` (validation
lists them), update the flavour count texts. Temporarily sold out: `"available": false` (card and page show
„Chwilowo niedostępna”).

## Change prices and show prices

Prices are hidden everywhere while `site.json → catalog.showPrices` is `false`. Known today: Oreo 24 zł (from Wolt);
every other price must come from the owner.

1. `src/data/products.json`: set `"price": 24` (number, PLN, no "zł") per product; `null` = no price.
2. When all prices are in: `src/data/site.json → catalog.showPrices: true`. Keep `priceRange` (e.g. `"20–40 zł"`) true.
3. `npm run content:check && npm run build`.

With `showPrices: true`: cards show the price pill instead of the badge, product pages show the price (formatted in the
page language, e.g. `24,00 zł`), structured data becomes `Product` + `Offer` for products with a price, analytics events
carry `value`/`price`, `llms.txt` lists "Cena". Nothing else needs translating (the number is formatted per language).

## Change colours

File: `src/data/site.json → theme.colors` (`#RRGGBB`): `cream`, `ink`, `brand`, `brandDeep`, `blush`, `caramel` — roles
in [CONTENT-REFERENCE.md](CONTENT-REFERENCE.md#theme-colours-and-contrast).

1. Change the values. Keep the brand family (raspberry/cream/chocolate/caramel) unless the owner rebrands.
2. `npm run content:check` — fails with e.g. `brandDeep on cream has contrast 3.71:1, needs ≥ 4.5:1 (WCAG AA)` until the
   pairs are readable; darken/lighten until it passes.
3. If `cream` changed: `rm public/images/*/*-og.jpg && npm run images` (social previews of cut-outs use it).
4. `npm run dev` — the frames, buttons, footer and stickers all follow; `theme-color` (mobile browser bar) is `brandDeep`.

## Add a page

Example: "O nas" at `/o-nas`.

1. Create `src/data/pages/o-nas.json`:

   ```json
   {
     "$schema": "../../../schema/page.schema.json",
     "path": "/o-nas",
     "seo": { "title": "O nas – cukiernia na Wildzie", "description": "…" },
     "sections": [
       { "id": "o-nas", "type": "text", "heading": "O nas", "blocks": [{ "kind": "paragraph", "text": "…" }] },
       { "id": "zamow", "type": "cta", "heading": "Cynamonka już czeka.", "primaryCta": { "label": "Zamów na Wolt", "href": "@order", "variant": "light" } }
     ]
   }
   ```

   The first section is a `text` with `heading` (or a `hero`). Any section type works below it.
2. Link it: `site.json → nav` (`{ "label": "O nas", "href": "/o-nas" }`) or a footer column.
3. Translations: `src/data/i18n/<locale>/pages/o-nas.json` with `seo` and `sections` texts (by `id`), and the new nav
   label at its position in `src/data/i18n/<locale>/site.json → nav`.
4. `npm run content:check && npm run build` → `/o-nas/`, `/en/o-nas/`, … with canonical, hreflang, breadcrumb JSON-LD,
   sitemap entries. In `npm run dev` the new route appears without a restart.

Delete a page: delete the file and its overlays, remove links to it (validation lists them). `home.json` cannot be
deleted.

## Translate missing texts

1. `npm run i18n:status` — how much is missing per language and file.
2. `npm run i18n:status -- en --missing` — every missing English text: `path: "Polish text"`.
3. Add translations at those paths in `src/data/i18n/en/<file>` (create the file if it does not exist; rules and
   examples in [I18N.md](I18N.md)). Or let an LLM do it:
   - `npm run ai -- "Przetłumacz brakujące teksty na angielski" --dry-run`, then without `--dry-run`;
   - MCP chat: "translate the missing Ukrainian texts" (tools `translation_status` + `patch_content`).
4. `npm run content:check && npm run i18n:status`.
5. Review titles/descriptions against `docs/SEO-KEYWORDS.md` section 2 for that language.

## Add a language

Full procedure (site.json entry, overlays, fonts for new alphabets, checks): [I18N.md → Adding a
language](I18N.md#adding-a-language).

## Flavour particles (hover effect)

Hovering a bun (flavour cards, the hero spotlight card, the showcase cut-out; on phones: scrolling it into view) makes ten ingredient pieces fly out from behind the
bun and hover around it, with steam rising behind it. The pieces are images
`assets/images/particles/<product-slug>-1.png` … `-10.png` (transparent PNG, about 110 px; run `npm run images`).
A product without them gets only the steam. Component: `src/components/product/ProductParticles.tsx`, styles
`.pp-*` in `src/styles/globals.css`. The current pieces are AI illustrations (Higgsfield), decorative only.

## Replace AI images with real photos

AI illustrations today: `hero/cynamonka` (home hero), `cutouts/malina-z-kokosem` and `products/malina-z-kokosem`
(flavour „Malina z kokosem”). Find all uses: `grep -rn '"aiGenerated": true' src/data`.

1. Put the real photo at the **same path** to keep the key: `assets/images/hero/cynamonka.png` (hero: transparent PNG
   cut-out of a roll in a hand or on its own works best; a normal photo is shown in a round plate crop),
   `assets/images/cutouts/malina-z-kokosem.png` (transparent), `assets/images/products/malina-z-kokosem.jpg` (square
   plate photo). Same name, same extension — or delete the old file if the extension changes.
2. `npm run images` (regenerates every size because the source is newer).
3. In the JSON, at every use of that key: remove `"aiGenerated": true` and rewrite `alt` (drop the "Ilustracja:"
   prefix, describe the real photo). Do the same for the `alt` in the translation overlays.
4. If the hero shows a different flavour now, update `hero.note` ("Sernik z truskawką…") to match.
5. `npm run content:check && npm run build`; look at the hero on a phone width.

Images are cached by browsers for 7 days (`public/.htaccess`); returning visitors may see the old picture until then. To
show the new one immediately, give it a new name (e.g. `hero/cynamonka-foto`) and use that key instead.

## Refresh Google reviews

Automatic: workflow **Refresh Google reviews** (`.github/workflows/reviews.yml`) runs every Monday 05:17 UTC, commits
`reviews.json` when it changed, and the deploy workflow publishes it. Needs the repository secret
`GOOGLE_PLACES_API_KEY` (optional variable `GOOGLE_PLACE_ID`); without the secret it is skipped.

Manually:

1. `.env.local`: `GOOGLE_PLACES_API_KEY=…` (Google Cloud → Places API (New) enabled; restrict the key to that API).
   Optional `GOOGLE_PLACE_ID=…` — without it the script searches by name + address and prints the id to save.
2. `npm run reviews:fetch -- --dry-run` — shows the result, writes nothing.
3. `npm run reviews:fetch` — replaces `src/data/reviews.json` (rating, count, up to 5 newest reviews from Google, author's
   original text) and points `site.json → links.writeReview` at Google's review form.
4. `npm run content:check`, commit, push.

Never edit `reviews.json` by hand or with an LLM, never translate or invent reviews. Which reviews show: the reviews
section's `minRating` / `maxItems`. Google allows caching this data for 30 days — keep the weekly refresh on.

---

## Add a new section type (code)

Only when no existing type fits. Example: a `steps` section ("how to order" in numbered steps).

1. **Schema** — `src/content/schema.ts`, next to the other section types:

   ```ts
   export const StepsSection = z
     .strictObject({
       ...sectionBase,
       type: z.literal('steps'),
       tone: Tone.default('cream'),
       heading: text,
       sticker: Sticker.optional(),
       items: z
         .array(z.strictObject({ title: text.describe('Short step name'), text: text.describe('One or two sentences') }))
         .min(1)
         .max(6)
         .describe('Steps in order'),
     })
     .describe('Numbered steps, e.g. how to order or how to find the entrance')
   ```

   and add `StepsSection` to `export const Section = z.discriminatedUnion('type', [ … ])`. Describe every field — the
   descriptions are what LLM editors read. Fixed labels the component needs go to `Ui` (with a Polish default).
2. **Validation** — `src/content/validate.ts` already checks every `{ src, alt }` image and every `href` in any section.
   Add checks only for new kinds of references (product slugs, categories), next to the `productGrid` checks.
3. **Component** — `src/sections/Steps.tsx`:

   ```tsx
   import { Reveal } from '@/components/ui/Reveal'
   import { Container, Section, SectionHeading } from '@/components/ui/Section'
   import type { SectionProps } from './types'

   /** Numbered steps (section type "steps"). */
   export default function Steps({ section }: SectionProps<'steps'>) {
     const headingId = `${section.id}-heading`
     return (
       <Section id={section.id} tone={section.tone} labelledBy={headingId}>
         <Container>
           <Reveal>
             <SectionHeading id={headingId} tone={section.tone} sticker={section.sticker}>
               {section.heading}
             </SectionHeading>
           </Reveal>
           <ol className="mx-auto mt-10 grid max-w-3xl gap-4 md:mt-14">
             {section.items.map((item, i) => (
               <li key={i} className="rounded-2xl p-5 ring-1 ring-current/15 ring-inset sm:p-6">
                 <p className="font-display text-3xl leading-none">{i + 1}</p>
                 <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
                 <p className="mt-1 leading-relaxed">{item.text}</p>
               </li>
             ))}
           </ol>
         </Container>
       </Section>
     )
   }
   ```

   Rules: content only from `section` / `useContent()`; links via `CtaButton`/`SmartLink`; images via `Picture` with
   real `sizes`; no `window` during render; heading levels `h2` (section) / `h3` (items).
4. **Registry** — `src/sections/registry.tsx`: `import Steps from './Steps'` and `steps: Steps` in `sectionRegistry`
   (TypeScript fails until every type is registered).
5. **Translations** — string fields that are identifiers/URLs/settings (not texts) must be listed in `NOT_TRANSLATABLE`
   in `src/content/i18n.ts`; plain texts (`heading`, `title`, `text`) need nothing.
6. **Generated docs** — `npm run content:schema && npm run docs:reference` (`content:check` fails while `schema/` is
   stale).
7. **Use it** — add `{ "id": "jak-zamowic", "type": "steps", "heading": "Jak zamówić?", "items": [ … ] }` to a page.
8. **Check** — `npm run content:check && npm run typecheck && npm run build`, look at it in `npm run dev` (phone and
   desktop widths, every tone you allow), and add a row to "Where content lives" in `AGENTS.md` if it introduces a new
   kind of content.

## Change fonts

Fonts are self-hosted subsets (no Google Fonts request). Display: Anton (+ Sofia Sans Extra Condensed ExtraBold as the
Cyrillic stand-in), body: Manrope Variable.

1. Install the new font as a dev dependency from Fontsource, e.g. `npm i -D @fontsource/<font>` (variable fonts:
   `@fontsource-variable/<font>`).
2. `scripts/subset-fonts.sh`: change the `cp`/`pyftsubset` lines to the new `node_modules/@fontsource…/files/*.woff2`
   files (keep the Latin file whole; cut latin-ext to the Polish letters `$PL`, Cyrillic to `$CYR`). Run
   `bash scripts/subset-fonts.sh` (needs `pip install fonttools brotli`). Output: `src/assets/fonts/*.woff2`.
3. `src/styles/globals.css`: update the `@font-face` blocks (`src`, `font-family`, weights, `unicode-range`) and
   `--font-display` / `--font-sans` in `@theme`.
4. `src/components/layout/Layout.tsx`: the `?url` imports and `<link rel="preload" as="font">` lines must name the
   display font files of the headline (only those are preloaded; `scripts/postbuild.ts` removes every other preload).
5. `src/components/layout/footer/Wordmark.tsx`: the `advance()` widths are measured for Anton — re-measure for the new
   display font so the giant footer wordmark keeps its proportions.
6. `npm run build`, check headlines in PL/RU/UK, check Lighthouse (font swap must not shift the layout).

## Connect GA4, Meta Pixel, GTM or TikTok

All optional; an empty ID = that vendor is off. Nothing loads before consent in the cookie banner. Details:
[TRACKING.md](TRACKING.md).

| Variable | Value | Must be named in the banner and the privacy policy as |
| --- | --- | --- |
| `VITE_GA_ID` | `G-XXXXXXXXXX` | "Google Analytics" |
| `VITE_META_PIXEL_ID` | digits | "Meta" |
| `VITE_GTM_ID` | `GTM-XXXXXXX` | "Google Tag Manager" |
| `VITE_TIKTOK_PIXEL_ID` | `C0XXXXXXXX…` | "TikTok" |

1. **Texts first.** The Polish banner (`site.json → consent.text`, `analyticsText`, `marketingText`) already names Google
   Analytics and Meta Pixel; the privacy policy (`src/data/pages/polityka-prywatnosci.json`) names GA, Meta, GTM and
   TikTok. Adding TikTok or GTM: name it with its purpose in the banner texts. Update the same texts in
   `src/data/i18n/<locale>/site.json → consent` and the translated privacy policy (the build checks only the Polish texts).
2. **IDs.** Production: GitHub → Settings → Secrets and variables → Actions → **Variables** (or Secrets) with the names
   above; the deploy workflow passes them to the build. Local test: put them into `.env.local`.
3. **Check:** `npm run content:check` fails with `VITE_… is set, but "…" is not named …` until step 1 is done. After
   deploying, open the site with `?debug_analytics=1`, accept cookies, watch the console (`[analytics] page_view …`).
4. **Vendor side:** GA4 → turn off "Page changes based on browser history events" in enhanced measurement; register the
   custom dimensions `location`, `provider`, `network`, `kind`, `detail`, `page_language`; mark `click_order` as a key
   event. Use either `VITE_GA_ID` or a GA4 tag in GTM, not both.

Everybody is asked for consent again automatically when the set of enabled vendors changes.

## Deploy via FTP

Automatic on every push to `main` (`.github/workflows/deploy.yml`). One-time setup in GitHub → Settings → Secrets and
variables → Actions:

- Secrets: `FTP_SERVER` (host), `FTP_USERNAME`, `FTP_PASSWORD`, optional `FTP_SERVER_DIR` (default `./public_html/`).
- Variables: `SITE_URL` (required, e.g. `https://example.pl` — the job fails without it), optional `FTP_PROTOCOL`
  (`ftps` default; `ftp` only if the host has no TLS), optional `VITE_BASE` (sub-folder deploy).

Manual deploy from a computer:

```bash
SITE_URL=https://example.pl npm run build     # or put SITE_URL into .env.local
```

then upload the **contents** of `dist/` (including the hidden `.htaccess`) into `public_html/`. Details, sub-folder
deploy next to WordPress, `.htaccess`: [DEPLOY.md](DEPLOY.md).

## Preview on GitHub Pages

The same deploy workflow publishes every push to https://sunlucki.github.io/SLODKO-MI/ (one-time: Settings → Pages →
Source: **GitHub Actions**). It is built with `VITE_BASE=/SLODKO-MI/` and `NOINDEX=1` (all pages `noindex`, no sitemap),
without pixels. Reproduce locally:

```bash
OUT_DIR=.tmp/pages/dist VITE_BASE=/SLODKO-MI/ NOINDEX=1 SITE_URL=https://sunlucki.github.io/SLODKO-MI npx vite-react-ssg build
OUT_DIR=.tmp/pages/dist VITE_BASE=/SLODKO-MI/ NOINDEX=1 SITE_URL=https://sunlucki.github.io/SLODKO-MI npx tsx scripts/postbuild.ts
npx vite preview --outDir .tmp/pages/dist --base /SLODKO-MI/ --port 4180   # → http://localhost:4180/SLODKO-MI/
```

## Set the production domain (SITE_URL)

Owner decision first: the domain (e.g. `https://example.pl`). `public/.htaccess` redirects `www.` to the bare domain
and http to https, so use the **bare https** form without a trailing slash.

1. GitHub → Settings → Secrets and variables → Actions → Variables → `SITE_URL` = `https://example.pl`.
2. `src/data/site.json → url` = the same value (fallback for local builds; today it is the GitHub Pages address).
3. Point the domain's DNS at the hosting and enable HTTPS (Let's Encrypt/AutoSSL) at the host.
4. Push to `main` → canonical URLs, `og:url`, hreflang, JSON-LD, `sitemap.xml`, `robots.txt` and `llms.txt` use the
   domain. The GitHub Pages preview then names the production URLs as canonical (it stays `noindex`).
5. Owner: Google Search Console (Domain property, submit `https://example.pl/sitemap.xml`), Google Business Profile
   website field (`https://example.pl/?utm_source=google&utm_medium=organic&utm_campaign=gbp`), Instagram/Facebook bio
   links.

Sub-folder instead of a domain root (`https://example.pl/slodkomi`): also set `VITE_BASE=/slodkomi/` — see DEPLOY.md.

## Edit with MCP, the CLI or the GitHub Action

All three write only content files, validate with the same rules as the build and roll back on errors. Setup per
client: [LLM-EDITING.md](LLM-EDITING.md) (Russian, for the owner).

- **MCP server** `slodkomi-content` (`npm run mcp`, registered in `.mcp.json` for Claude Code): tools `list_content`,
  `get_schema`, `read_content`, `write_content`, `patch_content`, `delete_page`, `translation_status`,
  `validate_content`, `list_images`, `add_image`, `build_site`. Typical flow: `list_content` → `read_content` →
  `patch_content` → `build_site`.
- **CLI**: `npm run ai -- "Dodaj do FAQ pytanie o parking" --dry-run` (shows the diff, restores the files), without
  `--dry-run` asks "Keep these changes?"; `--yes --build` for no questions + build; `--prompt` prints the full prompt for a
  chat; `--response answer.json` applies a chat's answer. Provider in `.env.local`: `LLM_PROVIDER` (`anthropic` |
  `openai`), `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`.
- **GitHub Action** "AI edit": Actions → AI edit → Run workflow → instruction → a pull request with the validated,
  built change → merge = deploy. Needs secret `LLM_API_KEY` and "Allow GitHub Actions to create and approve pull
  requests".

## Use React Bits Pro components (@reactbits-starter)

`components.json` registers three shadcn registries: `@react-bits` (free; source of `LogoLoop`, `CurvedLoop`,
`BounceCards`, `Magnet`, `StickerPeel`, `ShinyText`), `@reactbits-starter` and `@reactbits-pro` (paid, authorised with
`REACTBITS_LICENSE_KEY`). The `shadcn` MCP server in `.mcp.json` lets an agent browse them.

1. Put the licence key into `.env.local` (`REACTBITS_LICENSE_KEY=…`) or pass it in the shell. Without it the paid
   registries answer "You are not authorized to access the item at https://pro.reactbits.dev/…".
2. Look before adding: `npx shadcn@latest view @reactbits-starter/<component>` prints the item (files, `dependencies`).
   Free components are named `<Name>-TS-TW` (TypeScript + Tailwind), e.g. `npx shadcn@latest view @react-bits/ShinyText-TS-TW`.
3. `REACTBITS_LICENSE_KEY=… npx shadcn@latest add @reactbits-starter/<component>` — copies the source under
   `src/components/` (alias `@/components`; the existing ones were flattened to `src/components/<Name>.tsx`). Review the
   diff: if it added a heavy dependency (`motion`, `gsap`, `three`, …) to `package.json`, prefer another component or
   rewrite it with CSS — the Lighthouse ≥ 95 budget does not allow them.
4. Wire it into a section component; its texts/images must come from content (new section type or new optional
   fields), not be hardcoded. Make it SSR-safe (no `window` during render), keyboard-accessible, and static under
   `prefers-reduced-motion`.
5. `npm run typecheck && npm run build`, then check Lighthouse.

## Check performance (Lighthouse)

```bash
OUT_DIR=.tmp/lh/dist npx vite-react-ssg build && OUT_DIR=.tmp/lh/dist npx tsx scripts/postbuild.ts
npx vite preview --outDir .tmp/lh/dist --port 4190 &
npx lighthouse@12 http://localhost:4190/ --quiet --chrome-flags="--headless=new" --output=html --output-path=.tmp/lh/report.html
```

Mobile is the default profile. Target ≥ 95 in Performance, Accessibility, Best Practices and SEO; also test
`/en/` and a product page. Stop the preview server afterwards and delete `.tmp/lh`.

## Undo a change

- Not committed yet: `git diff` to see it, `git checkout -- <file>` to drop it.
- `npm run ai` keeps the previous files in `.ai-edit-backup/<date>/` — copy them back.
- Already deployed: revert the commit (`git revert <sha>` or "Revert" on the merged pull request) and push — the deploy
  workflow publishes the previous state.
