# Content reference

Every content file, every field, every section type. The contract is `src/content/schema.ts` (Zod); the tables at the end
are generated from it (`npm run docs:reference`), the JSON Schemas in `schema/` too (`npm run content:schema`). If this
page and the schema disagree, the schema wins — regenerate.

- [Files](#files)
- [Page files and section types](#page-files-and-section-types) — with an example of every type
- [Links and tokens](#links-and-tokens)
- [Images](#images)
- [Interface texts (`site.json → ui`)](#interface-texts-sitejson--ui)
- [Theme colours and contrast](#theme-colours-and-contrast)
- [Languages (`site.json → i18n`)](#languages-sitejson--i18n)
- [Validation rules beyond the schema](#validation-rules-beyond-the-schema)
- [Field reference (generated)](#field-reference-generated)

## Files

| File | Holds | Edited by | Translated |
| --- | --- | --- | --- |
| `src/data/site.json` | Business data (name, contact, address, links, hours), navigation, header/footer, catalogue settings, theme, default SEO, cookie banner, interface texts, languages | you / LLM tools | texts only, in `src/data/i18n/<locale>/site.json` |
| `src/data/products.json` | Categories and products (flavours) — cards, `/produkt/<slug>/` pages, product grids | you / LLM tools | texts only, in `src/data/i18n/<locale>/products.json` |
| `src/data/pages/<name>.json` | One page each: `path`, `seo`, ordered `sections[]`. `home.json` is `/` | you / LLM tools | texts only, in `src/data/i18n/<locale>/pages/<name>.json` |
| `src/data/reviews.json` | Google rating, count and reviews | **only** `npm run reviews:fetch` | never (reviews show in the author's language) |
| `src/generated/images.json` | Image manifest: key → size, generated widths, transparency | **only** `npm run images` | — |
| `src/data/i18n/<locale>/…` | Translation overlays: the same file names, only the texts | you / LLM tools | — |

Each data file starts with `"$schema"` pointing at `schema/*.schema.json`, so VS Code / Cursor autocomplete and flag
mistakes while you type. Objects are **strict**: an unknown or misspelled key is an error, never silently ignored.

## Page files and section types

```json
{
  "$schema": "../../../schema/page.schema.json",
  "path": "/o-nas",
  "seo": { "title": "O nas", "description": "Kim jesteśmy i jak pieczemy cynamonki na Wildzie." },
  "sections": [ { "id": "…", "type": "…" } ]
}
```

- `path`: lowercase, starts with `/` (`/`, `/o-nas`, `/eventy`). Every file becomes a route in every language (`/o-nas/`,
  `/en/o-nas/`, …). `/produkt…` is reserved for product pages. Exactly one page has `"path": "/"`.
- `seo.title` ≤ 70 chars by schema, ≤ 48 recommended (the template `site.seo.titleTemplate` = `"%s | Słodko Mi"` adds 12);
  `seo.description` ≤ 170 by schema, ≤ 155 recommended; `seo.ogImage` = image key for social previews (default
  `site.seo.ogImage`); `seo.noindex: true` hides the page from search (no canonical, no hreflang, not in the sitemap).
- `sections[]`: rendered top to bottom; `"enabled": false` hides one. The first enabled section must be `hero` or a `text`
  section with a `heading` (the page's `<h1>`); at most one `hero`, and only first.
- Every section has `id` (unique on the page, `a-z0-9-`, also the `#anchor`), `type`, `enabled` (default `true`).
- `tone` (where available): `cream` (light), `blush` (soft pink), `brand` (raspberry, light text), `ink` (chocolate,
  light text), `caramel` (warm yellow).
- `sticker`: small tilted tag next to the heading, ≤ 32 characters.

The examples below are complete and pass validation (checked with `loadContent()`); copy one into a page's `sections`
and change the texts. All fields: [Section types](#section-types).

### `hero` — top block in the notched frame

The header sits in the frame's top notches, the spotlight card (md+) in the bottom-right notch, the `ticker` along the
bottom. A transparent cut-out image floats; a normal photo gets a round "plate" crop. Only the hero image loads with
high priority (LCP).

```json
{
  "id": "start",
  "type": "hero",
  "headline": [{ "text": "TEJ, POZNAŃ…" }, { "text": "CZAS NA" }, { "text": "CYNAMONKĘ", "accent": true }],
  "description": "Puszyste, wilgotne, pieczone codziennie. Wejście od ul. Hetmańskiej.",
  "image": { "src": "hero/cynamonka", "alt": "Ilustracja: dłoń trzymająca cynamonkę", "aiGenerated": true },
  "note": { "title": "Sernik z truskawką", "subtitle": "jeden z bestsellerów" },
  "aside": "Każdego ranka robimy ciasto od podstaw.",
  "primaryCta": { "label": "Zamów na Wolt", "href": "@order", "variant": "light" },
  "secondaryCta": { "label": "Wyznacz trasę", "href": "@directions", "variant": "light" },
  "spotlight": { "label": "Bestsellery", "productSlugs": ["sernik-z-truskawka", "szarlotka"] },
  "ticker": ["Puszyste", "Wilgotne", "7 smaków"]
}
```

`headline`: 1–4 lines, `accent: true` = caramel line. `secondaryCta` renders as a round map-pin button (its `label` is
the accessible name). `aside` shows on large screens only.

### `about` — centred statement

```json
{
  "id": "o-nas",
  "type": "about",
  "tone": "cream",
  "heading": "Puszyste. Wilgotne. Prosto z pieca.",
  "sticker": "Robione na miejscu",
  "body": ["Pierwszy akapit.", "Drugi akapit."],
  "images": [
    { "src": "photos/lopatka", "alt": "Cynamonka na łopatce" },
    { "src": "photos/szczypce", "alt": "Cynamonka Oreo nakładana szczypcami" }
  ],
  "cta": { "label": "Poznaj smaki", "href": "#smaki" }
}
```

`images`: up to 2 small photos left and right. A bare `#smaki` works here because the target is on the same page.

### `split` — photo/video with big words + coloured product panel

```json
{
  "id": "w-srodku",
  "type": "split",
  "left": {
    "title": ["ZAJRZYJ", "DO ŚRODKA."],
    "image": { "src": "photos/blacha-zlota", "alt": "Blacha złocistych cynamonek" },
    "video": { "src": "video/smaki.mp4", "poster": { "src": "photos/blacha-zlota", "alt": "Blacha złocistych cynamonek" } }
  },
  "right": {
    "tone": "caramel",
    "heading": "TO, CO NAJLEPSZE",
    "image": { "src": "cutouts/szarlotka", "alt": "Cynamonka szarlotka z kruszonką i karmelem" },
    "caption": "Pełne nadzienia i upieczone tego samego dnia.",
    "cta": { "label": "Zobacz smaki", "href": "#smaki" }
  }
}
```

`left.video.src` is a file in `public/` (muted, looped, plays when visible; the file must exist). Without `video` the
image shows.

### `productGrid` — product cards

```json
{
  "id": "smaki",
  "type": "productGrid",
  "heading": "Poznaj nasze smaki.",
  "sticker": "7 wariantów",
  "intro": "Krótki tekst nad kartami.",
  "source": { "mode": "all" },
  "cta": { "label": "Zamów na Wolt", "href": "@order" }
}
```

`source` picks the products (array order of `products.json` = card order):

| `source` | Shows |
| --- | --- |
| `{ "mode": "all" }` (default) | every product |
| `{ "mode": "featured" }` | products with `"featured": true` |
| `{ "mode": "category", "category": "cynamonki" }` | one category |
| `{ "mode": "manual", "slugs": ["szarlotka", "sernik-z-truskawka"] }` | exactly these, in this order |

`limit` cuts the list. A grid that ends up empty renders nothing and cannot be a link target. The first enabled grid on
the home page is the "catalogue" step of the product-page breadcrumb.

### `reviews` — Google reviews carousel

```json
{
  "id": "opinie",
  "type": "reviews",
  "heading": "Nie wierz nam na słowo.",
  "sticker": "Opinie z Google",
  "backgroundImage": { "src": "photos/zespol", "alt": "Zespół Słodko Mi za witryną z cynamonkami" },
  "maxItems": 5,
  "minRating": 4
}
```

Data comes from `reviews.json` (newest first, `minRating`+ stars, at most `maxItems`). `readAllLabel` (→ `@reviews`),
`writeLabel` (→ `@writeReview`, shown only when `site.links.writeReview` is set) and `notice` have Polish defaults. Keep
`notice`: EU law requires saying where reviews come from and whether they are verified.

### `visit` — address, hours, phone, map

```json
{
  "id": "dojazd",
  "type": "visit",
  "tone": "blush",
  "heading": "Wpadnij na Wildę.",
  "sticker": "Wejście od Hetmańskiej",
  "intro": "Wejście jest od strony ul. Hetmańskiej.",
  "image": { "src": "photos/pudelka", "alt": "Cynamonki na wynos w pudełkach" },
  "showMap": true,
  "ctas": [
    { "label": "Wyznacz trasę", "href": "@directions" },
    { "label": "Zadzwoń", "href": "@phone", "variant": "secondary" }
  ]
}
```

Address, entrance note, hours, special hours (next 14 days), "open now" and phone come from `site.json`. The Google map
loads only after a click (`showMap`); labels are in `site.json → ui.visit`. `ctas`: up to 4 buttons (default: route,
call, Wolt).

### `gallery` — photo collage

```json
{
  "id": "instagram",
  "type": "gallery",
  "heading": "Prosto z naszej blachy.",
  "sticker": "@slodkomi.poznan",
  "images": [
    { "src": "photos/krem", "alt": "Cynamonki z kremem na blasze" },
    { "src": "photos/biscoff-blacha", "alt": "Cynamonki Biscoff na blasze" },
    { "src": "photos/blachy", "alt": "Blachy z cynamonkami" }
  ],
  "cta": { "label": "Obserwuj na Instagramie", "href": "@instagram" }
}
```

`images`: 3–8.

### `faq` — questions and answers

```json
{
  "id": "faq",
  "type": "faq",
  "heading": "Pytania i odpowiedzi.",
  "items": [{ "question": "Czy macie dostawę?", "answer": "Tak — przez Wolt." }]
}
```

Also emitted as `FAQPage` structured data. Answers are facts: only what the owner confirmed.

### `cta` — bold banner with buttons

```json
{
  "id": "zamow",
  "type": "cta",
  "tone": "brand",
  "heading": "Cynamonka już czeka.",
  "text": "Zamów przez Wolt albo wpadnij na Wildę.",
  "primaryCta": { "label": "Zamów na Wolt", "href": "@order", "variant": "light" },
  "secondaryCta": { "label": "Zadzwoń", "href": "@phone", "variant": "secondary" },
  "image": { "src": "cutouts/oreo", "alt": "Cynamonka Oreo" },
  "marquee": "TEJ, czas na cynamonkę"
}
```

`marquee` = text of the curved moving band; omitted → `site.tagline`; `""` hides the band (it has a pause button).

### `text` — plain text page content

```json
{
  "id": "o-nas",
  "type": "text",
  "heading": "O nas",
  "blocks": [
    { "kind": "paragraph", "text": "Akapit tekstu." },
    { "kind": "subheading", "text": "Śródtytuł" },
    { "kind": "list", "items": ["Punkt pierwszy", "Punkt drugi"] }
  ]
}
```

As the first section, its `heading` is the page `<h1>` (privacy policy, "O nas"…). Plain text only — no HTML/Markdown.

## Links and tokens

Every `href` (CTAs, `nav`, footer links, `consent.policyHref`) accepts:

| Value | Resolves to | Tracked as (GA4 / Meta) |
| --- | --- | --- |
| `@order` | `site.links.order` (Wolt) | `click_order` / `InitiateCheckout` |
| `@phone` | `tel:` + `site.contact.phone` | `click_phone` / `Contact` |
| `@directions` | `site.links.directions` (Google Maps route) | `click_directions` / `FindLocation` |
| `@instagram` | `site.links.instagram` | `click_social` / `SocialClick` |
| `@facebook` | `site.links.facebook` (must be set when used) | `click_social` / `SocialClick` |
| `@reviews` | `site.links.reviews` | `click_reviews` (`kind: read`) / `ReviewsClick` |
| `@writeReview` | `site.links.writeReview` (must be set when used) | `click_reviews` (`kind: write`) / `ReviewsClick` |
| `/`, `/o-nas`, `/produkt/oreo` | internal page (gets the language prefix and a trailing slash automatically) | — |
| `/#smaki`, `/o-nas#faq` | section on a page (must exist and be enabled) | — |
| `#smaki` | section on the **same page file** only — not allowed in `site.json` / `products.json` | — |
| `https://…`, `mailto:…`, `tel:…` | as written (http opens in a new tab); wolt.com / instagram.com / facebook.com URLs and `tel:` are tracked like the tokens | — |

Write internal links without a language prefix (`/produkt/oreo`, never `/en/produkt/oreo`): on an English page the link
becomes `/en/produkt/oreo/` automatically. Tokens keep phone numbers and URLs in one place and attach tracking.

## Images

- **Key** = `"<group>/<name>"`, the path under `assets/images/` without extension. Groups in use: `products/` (square plate
  photos), `cutouts/` (transparent PNG of each flavour), `hero/` (hero cut-out), `photos/` (atmosphere, portrait),
  `og/` (social preview 1200×630, `og/default` = `site.seo.ogImage`). A new group is just a new folder.
- **Pipeline:** `npm run images` (`scripts/process-images.mjs`) writes WebP at 480/600/720/960/1600 px (only widths below
  the original, plus the original width up to 1600) to `public/images/<key>-<width>.webp`, records size/widths/alpha in
  `src/generated/images.json`, and makes `public/images/<key>.jpg` (1200×630) for `og/` images and
  `public/images/<key>-og.jpg` (cut-out centred on the `cream` colour) for every transparent image — the social preview of
  product pages. Files whose output is newer than the source are skipped. Commit the source, the generated files and the
  manifest.
- **Fields:** `{ "src": key, "alt": "description", "aiGenerated": false }`. `alt` describes what is visible, in the language
  of the file (translations translate it). `aiGenerated: true` shows a visible „Ilustracja” badge (`ui.common.illustration`)
  — mandatory for AI-generated or AI-redrawn pictures; a real photo with only the background removed is not AI-generated.
- **Currently AI-generated:** `hero/cynamonka`, `cutouts/malina-z-kokosem`, `products/malina-z-kokosem` (to be replaced by
  real photos — see RECIPES).
- **Transparent vs photo:** components read `alpha` from the manifest: cut-outs float with a shadow, photos are cropped
  (round plate in the hero/showcase, square on cards).
- **Video:** `public/video/<name>.mp4`, referenced as `"video/<name>.mp4"` with an image `poster`.

## Interface texts (`site.json → ui`)

Fixed labels that are not section content: product page (breadcrumbs, „Chwilowo niedostępna”, „Alergeny”, allergy note,
„Skład”, „Inne smaki”), 404 page, reviews carousel, visit section, menu, language switcher, AI badge, error page, day
names, allergen display names. Every key has a Polish default in `schema.ts`; put into `site.json → ui` only the keys that
should differ, e.g.:

```json
"ui": { "product": { "otherProductsHeading": "Spróbuj też" }, "allergenNames": { "orzechy": "orzechy (laskowe)" } }
```

- Placeholders in braces are filled in by the code: `{phone}` (contact.phoneDisplay), `{name}` (legalName), `{year}`,
  `{n}`/`{total}` (review slide), `{rating}`.
- `ui.reviews.countForms` = the noun for the plural categories one / few / many of the language
  (`["opinia", "opinie", "opinii"]`; English `["review", "reviews", "reviews"]`).
- `ui.product.otherProductsHeading: ""` hides the "other flavours" list on product pages.
- The word „Google” after `ui.reviews.sourcePrefix` / `ui.sections.reviewCountSource` and the Google logo are fixed in
  code (Google's attribution rule).
- Translations of `ui` go into `src/data/i18n/<locale>/site.json → ui` with the full key path; there the Polish defaults
  count as texts to translate too.

## Theme colours and contrast

`site.json → theme.colors` (`#RRGGBB`) is injected as CSS variables into every page and used through Tailwind tokens:

| Key | Token | Used for |
| --- | --- | --- |
| `cream` | `bg-cream`, `text-cream` | page background, light text on dark panels |
| `ink` | `text-ink`, `bg-ink` | body text, headings on light tones, dark panels |
| `brand` | `text-brand` | large display text and decoration only |
| `brandDeep` | `bg-brand-deep`, `text-brand-deep` | buttons, frames (hero, menu, footer), small coloured text, `brand` tone sections, `theme-color` |
| `blush` | `bg-blush` | soft pink panels (visit section, allergen box) |
| `caramel` | `bg-caramel`, `text-caramel` | stickers, hero accent line, ticker band |

The build checks WCAG AA contrast for the pairs the components use and fails otherwise:

| Foreground on background | Minimum |
| --- | --- |
| `brandDeep` on `cream`, `brandDeep` on `blush` | 4.5:1 |
| `ink` on `cream`, `ink` on `blush`, `ink` on `caramel`, `cream` on `ink` | 4.5:1 |
| `caramel` on `brandDeep` (hero accent line, small logo line, header button, spotlight label) | 4.5:1 |
| `brand` on `cream` (large text) | 3:1 |

`cream` is also the background of the generated social JPGs of cut-outs — after changing it, delete
`public/images/**/*-og.jpg` and run `npm run images`. Fonts are code, not content: see ARCHITECTURE and RECIPES.

## Languages (`site.json → i18n`)

```json
"i18n": {
  "defaultLocale": "pl",
  "locales": [
    { "code": "pl", "label": "Polski", "short": "PL", "htmlLang": "pl", "ogLocale": "pl_PL" },
    { "code": "en", "label": "English", "short": "EN", "htmlLang": "en", "ogLocale": "en_GB" }
  ],
  "autoDetect": true,
  "fallbackLocale": "en"
}
```

| Field | Meaning |
| --- | --- |
| `defaultLocale` | language of the files in `src/data/`, served at `/` |
| `locales[].code` | URL prefix (`/en/`) and folder `src/data/i18n/<code>/` |
| `locales[].label` / `short` | name in the switcher (in that language) / short code on the round button (≤ 3 chars) |
| `locales[].htmlLang` | `<html lang>`, hreflang, `Intl` formatting (dates, prices, plurals) |
| `locales[].ogLocale` | `og:locale` |
| `autoDetect` | first visit on a Polish URL → redirect to the browser's language (never bots); a choice in the switcher is remembered |
| `fallbackLocale` | where browsers in a language the site does not have are sent (here: English) |

Overlay rules, status and adding a language: [I18N.md](I18N.md).

## Validation rules beyond the schema

`npm run content:check` (and every build, the dev server, the MCP server, `npm run ai`) runs `loadContent()` in
`src/content/validate.ts`:

- every `{ src, alt }` image key exists in the manifest; `seo.ogImage` keys exist; a `video.src` file exists in `public/`;
- every `href` resolves: page path exists, `#anchor` section exists and renders (enabled; a product grid with ≥ 1
  product), `/produkt/<slug>` exists, `@facebook`/`@writeReview` only when that link is set, no bare `#id` in
  `site.json`/`products.json`;
- unique page paths, a home page `/`, `/produkt…` reserved; unique section ids; first enabled section `hero` or `text`
  with heading; one `hero` at most;
- product grids: `manual` slugs and `category` exist; hero `spotlight.productSlugs` exist; product `category` exists;
  unique product slugs;
- hours: each day in one entry; `closes` later than `opens` (midnight `00:00`); special dates unique and valid;
- theme contrast pairs (above);
- translations: every overlay merges cleanly (rules in I18N.md) and the merged result passes the same schema;
- consent (in `scripts/validate-content.ts`): every tracker enabled by a `VITE_*` ID is named in the cookie banner texts
  and the privacy policy (see TRACKING.md);
- `schema/` matches `schema.ts` (`export-schema.ts --check`).

<!-- BEGIN GENERATED: npm run docs:reference -->

## Field reference (generated)

> Generated from `src/content/schema.ts` by `npm run docs:reference` — do not edit this part by hand.

Columns: **Req.** = must be present (fields with a default may be left out); **Default** = value used when the field is
missing; **i18n** = `yes` when a translation overlay (`src/data/i18n/<locale>/…`) may contain this field — every other
field is a setting that only the Polish file holds. `a.b` = nested key, `a[]` = every item of array `a`.

### `src/data/site.json`

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | text | yes |  |  | yes | Brand name used in titles and wordmark |
| `legalName` | text | yes |  |  |  | Name as on Google Maps |
| `tagline` | text | yes |  |  | yes |  |
| `description` | text | yes |  |  | yes | Business description (used in structured data and defaults) |
| `url` | string | yes |  | format: uri |  | Canonical production URL without trailing slash (env SITE_URL overrides it at build time) |
| `i18n` | object | yes |  |  |  | Languages of the site |
| `i18n.defaultLocale` | string | yes |  | 2 lowercase letters |  | Language of the files in src/data (served at "/") |
| `i18n.locales` | object[] | yes |  | ≥ 1 items |  | Every language the site is published in; translations live in src/data/i18n/<code>/ |
| `i18n.locales[].code` | string | yes |  | 2 lowercase letters |  | URL prefix and folder name in src/data/i18n, e.g. "uk" |
| `i18n.locales[].label` | text | yes |  |  |  | Language name in that language, e.g. "Українська" |
| `i18n.locales[].short` | text | yes |  | ≤ 3 chars |  | Short label in the switcher, e.g. "UA" |
| `i18n.locales[].htmlLang` | string | yes |  | pattern `^[a-z]{2}(-[A-Z]{2})?$` |  | BCP 47 tag for <html lang> and hreflang, e.g. "uk" |
| `i18n.locales[].ogLocale` | string | yes |  | pattern `^[a-z]{2}_[A-Z]{2}$` |  | Open Graph locale, e.g. "uk_UA" |
| `i18n.autoDetect` | boolean |  | `true` |  |  | Send first-time visitors to the version in their browser language (never bots) |
| `i18n.fallbackLocale` | string |  |  | 2 lowercase letters |  | Version for browsers in a language the site does not have |
| `logo` | object | yes |  |  |  |  |
| `logo.wordmark` | text | yes |  |  |  |  |
| `logo.sub` | string |  |  |  | yes |  |
| `contact` | object | yes |  |  |  |  |
| `contact.phone` | string | yes |  | E.164, e.g. `+48511228221` |  |  |
| `contact.phoneDisplay` | text | yes |  |  |  |  |
| `contact.email` | string |  |  | format: email |  |  |
| `address` | object | yes |  |  |  |  |
| `address.street` | text | yes |  |  | yes |  |
| `address.postalCode` | string | yes |  | `00-000` |  |  |
| `address.city` | text | yes |  |  | yes |  |
| `address.district` | text | yes |  |  | yes |  |
| `address.country` | string |  | `"PL"` | exactly 2 chars |  |  |
| `address.entranceNote` | text | yes |  |  | yes | How to find the entrance |
| `address.geo` | object | yes |  |  |  |  |
| `address.geo.lat` | number | yes |  |  |  |  |
| `address.geo.lng` | number | yes |  |  |  |  |
| `links` | object | yes |  |  |  |  |
| `links.order` | string | yes |  | format: uri |  | Online ordering (Wolt) — target of @order |
| `links.googleMaps` | string | yes |  | format: uri |  | Place on Google Maps |
| `links.directions` | string | yes |  | format: uri |  | Route link — target of @directions |
| `links.reviews` | string | yes |  | format: uri |  | All Google reviews — target of @reviews |
| `links.writeReview` | string |  |  | format: uri |  | Google "write a review" form (needs the Place ID; set by npm run reviews:fetch) — target of @writeReview |
| `links.instagram` | string | yes |  | format: uri |  |  |
| `links.facebook` | string |  |  | format: uri |  |  |
| `links.mapEmbed` | string | yes |  | format: uri |  | Google Maps embed URL (loaded on click) |
| `hours` | object[] | yes |  | ≥ 1 items |  | Regular opening hours |
| `hours[].days` | string[] | yes |  | ≥ 1 items; items: `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`, `Su` |  |  |
| `hours[].opens` | string | yes |  | `HH:MM` (24 h) |  | 24-hour "HH:MM". "closes" must be later than "opens"; closing at midnight is "00:00". Only in the shape with { days, opens, closes }. |
| `hours[].closes` | string | yes |  | `HH:MM` (24 h) |  | 24-hour "HH:MM". "closes" must be later than "opens"; closing at midnight is "00:00". Only in the shape with { days, opens, closes }. |
| `hours[].closed` | `true` | yes |  |  |  | Only in the shape with { days, closed }. |
| `specialHours` | object[] |  | `[]` |  |  | Exceptions to the regular hours for specific dates (holidays, events), e.g. {"date":"2026-11-01","opens":"10:00","closes":"19:00","note":"Wszystkich Świętych"} |
| `specialHours[].date` | string | yes |  | format: date |  |  |
| `specialHours[].closed` | `true` | yes |  |  |  | Only in the shape with { date, closed, note }. |
| `specialHours[].note` | string |  |  |  | yes |  |
| `specialHours[].opens` | string | yes |  | `HH:MM` (24 h) |  | 24-hour "HH:MM". "closes" must be later than "opens"; closing at midnight is "00:00". Only in the shape with { date, opens, closes, note }. |
| `specialHours[].closes` | string | yes |  | `HH:MM` (24 h) |  | 24-hour "HH:MM". "closes" must be later than "opens"; closing at midnight is "00:00". Only in the shape with { date, opens, closes, note }. |
| `hoursNote` | string |  |  |  | yes |  |
| `servesCuisine` | text[] |  | `[]` |  | yes |  |
| `priceRange` | string |  |  |  | yes | e.g. "20–40 zł" |
| `nav` | [NavLink](#navlink)[] | yes |  | ≤ 6 items |  |  |
| `header` | object | yes |  |  |  |  |
| `header.cta` | [Cta](#cta) | yes |  |  |  |  |
| `footer` | object | yes |  |  |  |  |
| `footer.columns` | object[] | yes |  | ≤ 4 items |  |  |
| `footer.columns[].title` | text | yes |  |  | yes |  |
| `footer.columns[].links` | [NavLink](#navlink)[] | yes |  | ≥ 1 items |  |  |
| `footer.image` | [Image](#image) | yes |  |  |  |  |
| `footer.note` | string |  |  |  | yes |  |
| `catalog` | object | yes |  |  |  |  |
| `catalog.showPrices` | boolean | yes |  |  |  | false hides prices everywhere (cards, product pages, structured data) |
| `catalog.productCta` | [Cta](#cta) | yes |  |  |  | Main button on product pages |
| `catalog.secondaryCta` | [Cta](#cta) |  |  |  |  | Second button on product pages (e.g. route to the shop) |
| `theme` | object | yes |  |  |  | Design tokens injected as CSS variables |
| `theme.colors` | object | yes |  |  |  |  |
| `theme.colors.cream` | string | yes |  | `#RRGGBB` |  | Page background |
| `theme.colors.ink` | string | yes |  | `#RRGGBB` |  | Main text (chocolate) |
| `theme.colors.brand` | string | yes |  | `#RRGGBB` |  | Signature raspberry pink (display text, accents) |
| `theme.colors.brandDeep` | string | yes |  | `#RRGGBB` |  | Darker brand for frames/buttons — must keep ≥4.5:1 contrast with cream |
| `theme.colors.blush` | string | yes |  | `#RRGGBB` |  | Soft pink panels |
| `theme.colors.caramel` | string | yes |  | `#RRGGBB` |  | Warm yellow accent / stickers |
| `seo` | object | yes |  |  |  |  |
| `seo.titleTemplate` | string | yes |  | must contain `%s` | yes | "%s" is replaced with the page title |
| `seo.ogImage` | string | yes |  |  |  | Default social image key, e.g. "og/default" |
| `seo.keywords` | text[] |  | `[]` |  | yes |  |
| `consent` | object | yes |  |  |  |  |
| `consent.title` | text | yes |  |  | yes |  |
| `consent.text` | text | yes |  |  | yes |  |
| `consent.acceptAll` | text | yes |  |  | yes |  |
| `consent.rejectAll` | text | yes |  |  | yes |  |
| `consent.settings` | text | yes |  |  | yes |  |
| `consent.save` | text | yes |  |  | yes |  |
| `consent.analyticsLabel` | text | yes |  |  | yes |  |
| `consent.analyticsText` | text | yes |  |  | yes |  |
| `consent.marketingLabel` | text | yes |  |  | yes |  |
| `consent.marketingText` | text | yes |  |  | yes |  |
| `consent.policyLabel` | text | yes |  |  | yes |  |
| `consent.policyHref` | [Href](#href) | yes |  |  |  |  |
| `consent.reopenLabel` | text |  | `"Ustawienia cookies"` |  | yes | Footer button that reopens the cookie settings |
| `ui` | object |  | `{}` |  |  | Interface texts (labels, buttons, notices) of product pages, the 404 page, reviews and the visit section. All optional with Polish defaults. |
| `ui.product` | object |  | `{}` |  |  |  |
| `ui.product.breadcrumbHome` | text |  | `"Strona główna"` |  | yes | First breadcrumb on product pages (link to the home page) |
| `ui.product.catalogLabel` | text |  | `"Smaki"` |  | yes | Breadcrumb to the product grid, used when no nav link points at it |
| `ui.product.unavailable` | text |  | `"Chwilowo niedostępna"` |  | yes | Label on product cards and pages when available is false |
| `ui.product.allergensHeading` | text |  | `"Alergeny"` |  | yes |  |
| `ui.product.allergyNote` | text |  | `"Masz alergię? Zapytaj obsługę o pełny skład."` |  | yes | Always shown under the allergens |
| `ui.product.ingredientsHeading` | text |  | `"Skład"` |  | yes |  |
| `ui.product.otherProductsHeading` | string |  | `"Inne smaki"` |  | yes | Heading of the other flavours under each product; "" hides that list |
| `ui.notFound` | object |  | `{}` |  |  |  |
| `ui.notFound.title` | text |  | `"Nie znaleziono strony"` |  | yes | <title> of the 404 page |
| `ui.notFound.description` | text |  | `"Ta strona nie istnieje albo została przeniesiona."` |  | yes | Meta description of the 404 page |
| `ui.notFound.heading` | text |  | `"Tu nie ma cynamonek"` |  | yes | <h1> of the 404 page |
| `ui.notFound.text` | text |  | `"Ta strona nie istnieje albo została przeniesiona."` |  | yes |  |
| `ui.notFound.cta` | [Cta](#cta) |  | `{"label":"Strona główna","href":"/","variant":"primary"}` |  |  |  |
| `ui.reviews` | object |  | `{}` |  |  |  |
| `ui.reviews.sourcePrefix` | text |  | `"Opinie z"` |  | yes | Review card label; the word "Google" after it is fixed (attribution required by Google) |
| `ui.reviews.countForms` | [text, text, text] |  | `["opinia","opinie","opinii"]` | exactly 3 items | yes | Review count noun for the plural categories one / few / many (Intl.PluralRules of the language; English: ["review", "reviews", "reviews"]) |
| `ui.reviews.readMore` | text |  | `"Czytaj całość"` |  | yes | Expands a long review |
| `ui.reviews.readLess` | text |  | `"Zwiń"` |  | yes | Collapses an expanded review |
| `ui.reviews.carouselLabel` | text |  | `"Opinie klientów"` |  | yes | Screen-reader name of the reviews carousel |
| `ui.reviews.carouselRole` | text |  | `"karuzela"` |  | yes | Screen-reader role description of the carousel |
| `ui.reviews.slideRole` | text |  | `"opinia"` |  | yes | Screen-reader role description of one review |
| `ui.reviews.slideLabel` | text |  | `"{n} z {total}"` |  | yes | Screen-reader label of a review slide; {n} and {total} are replaced |
| `ui.reviews.ratingLabel` | text |  | `"Ocena {rating} na 5"` |  | yes | Screen-reader label of the stars; {rating} is replaced |
| `ui.reviews.averageLabel` | text |  | `"Średnia ocena {rating} na 5"` |  | yes | Screen-reader text of the overall rating; {rating} is replaced |
| `ui.reviews.previous` | text |  | `"Poprzednia opinia"` |  | yes |  |
| `ui.reviews.next` | text |  | `"Następna opinia"` |  | yes |  |
| `ui.visit` | object |  | `{}` |  |  |  |
| `ui.visit.address` | text |  | `"Adres"` |  | yes |  |
| `ui.visit.hours` | text |  | `"Godziny otwarcia"` |  | yes |  |
| `ui.visit.phone` | text |  | `"Telefon"` |  | yes |  |
| `ui.visit.openNow` | text |  | `"Otwarte teraz"` |  | yes |  |
| `ui.visit.closedNow` | text |  | `"Zamknięte"` |  | yes |  |
| `ui.visit.closedDay` | text |  | `"nieczynne"` |  | yes | Shown instead of hours on closed days |
| `ui.visit.specialHours` | text |  | `"Zmiany w godzinach"` |  | yes | Heading above upcoming dates from specialHours (next 14 days) |
| `ui.visit.showMap` | text |  | `"Pokaż mapę"` |  | yes |  |
| `ui.visit.mapNote` | text |  | `"Mapa ładuje się z Google po kliknięciu."` |  | yes | Privacy note under the map button |
| `ui.visit.mapTitle` | text |  | `"Mapa Google — {name}"` |  | yes | Accessible title of the map; {name} is replaced with site.legalName |
| `ui.visit.today` | text |  | `"dziś"` |  | yes | Screen-reader marker of today's row in the hours table |
| `ui.common` | object |  | `{}` |  |  |  |
| `ui.common.skipToContent` | text |  | `"Przejdź do treści"` |  | yes |  |
| `ui.common.mainNav` | text |  | `"Menu główne"` |  | yes | Screen-reader name of the main navigation |
| `ui.common.menu` | text |  | `"Menu"` |  | yes | Screen-reader name of the menu dialog |
| `ui.common.openMenu` | text |  | `"Otwórz menu"` |  | yes |  |
| `ui.common.closeMenu` | text |  | `"Zamknij menu"` |  | yes |  |
| `ui.common.call` | text |  | `"Zadzwoń: {phone}"` |  | yes | Label of round phone buttons; {phone} is replaced with contact.phoneDisplay |
| `ui.common.language` | text |  | `"Język strony"` |  | yes | Label of the language switcher |
| `ui.common.illustration` | text |  | `"Ilustracja"` |  | yes | Label on AI-generated illustrations |
| `ui.common.previousProduct` | text |  | `"Poprzedni produkt"` |  | yes |  |
| `ui.common.nextProduct` | text |  | `"Następny produkt"` |  | yes |  |
| `ui.common.pauseAnimation` | text |  | `"Zatrzymaj przewijany napis"` |  | yes | Pause switch of the moving text bands |
| `ui.common.breadcrumb` | text |  | `"Nawigacja okruszkowa"` |  | yes | Screen-reader name of the breadcrumb |
| `ui.common.errorTitle` | text |  | `"Coś poszło nie tak"` |  | yes | Heading shown when a page fails to load |
| `ui.common.errorText` | text |  | `"Odśwież stronę, aby spróbować ponownie."` |  | yes |  |
| `ui.layout` | object |  | `{}` |  |  |  |
| `ui.layout.copyright` | text |  | `"© {year} {name}"` |  | yes | Footer copyright line; {year} and {name} (site.legalName) are replaced |
| `ui.layout.reload` | text |  | `"Odśwież"` |  | yes | Button on the error page that reloads the page |
| `ui.days` | object |  | `{}` |  |  | Day names in the opening hours |
| `ui.days.short` | object |  | `{"Mo":"pon","Tu":"wt","We":"śr","Th":"czw","Fr":"pt","Sa":"sob","Su":"nd"}` |  |  |  |
| `ui.days.short.Mo` | text | yes |  |  | yes |  |
| `ui.days.short.Tu` | text | yes |  |  | yes |  |
| `ui.days.short.We` | text | yes |  |  | yes |  |
| `ui.days.short.Th` | text | yes |  |  | yes |  |
| `ui.days.short.Fr` | text | yes |  |  | yes |  |
| `ui.days.short.Sa` | text | yes |  |  | yes |  |
| `ui.days.short.Su` | text | yes |  |  | yes |  |
| `ui.days.long` | object |  | `{"Mo":"Poniedziałek","Tu":"Wtorek","We":"Środa","Th":"Czwartek","Fr":"Piątek","Sa":"Sob…` |  |  |  |
| `ui.days.long.Mo` | text | yes |  |  | yes |  |
| `ui.days.long.Tu` | text | yes |  |  | yes |  |
| `ui.days.long.We` | text | yes |  |  | yes |  |
| `ui.days.long.Th` | text | yes |  |  | yes |  |
| `ui.days.long.Fr` | text | yes |  |  | yes |  |
| `ui.days.long.Sa` | text | yes |  |  | yes |  |
| `ui.days.long.Su` | text | yes |  |  | yes |  |
| `ui.allergenNames` | { [string]: text } |  | `{"gluten":"gluten","skorupiaki":"skorupiaki","jaja":"jaja","ryby":"ryby","orzeszki ziem…` | keys: `gluten`, `skorupiaki`, `jaja`, `ryby`, `orzeszki ziemne`, `soja`, `mleko`, `orzechy`, `seler`, `gorczyca`, `sezam`, `dwutlenek siarki`, `łubin`, `mięczaki` | yes | Display names of allergens (key = value used in products.json); default = the Polish name, translations rename them |
| `ui.sections` | object |  | `{}` |  |  |  |
| `ui.sections.reviewCountSource` | text |  | `"w"` |  | yes | Word between the review count and the fixed word "Google" under the reviews ("123 opinii w Google") |

### `src/data/products.json`

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `categories` | object[] | yes |  | ≥ 1 items |  |  |
| `categories[].slug` | string | yes |  | `a-z`, `0-9`, `-` |  |  |
| `categories[].name` | text | yes |  |  | yes |  |
| `products` | object[] | yes |  | ≥ 1 items |  |  |
| `products[].slug` | string | yes |  | `a-z`, `0-9`, `-` |  | URL: /produkt/<slug>. Changing it changes the URL. |
| `products[].name` | text | yes |  |  | yes |  |
| `products[].category` | text | yes |  |  |  | Category slug from products.json → categories |
| `products[].price` | number \| null | yes |  |  |  | Price in PLN; null = not published |
| `products[].currency` | `"PLN"` |  | `"PLN"` |  |  |  |
| `products[].unit` | `"szt"` \| `"kg"` \| `"box"` |  | `"szt"` |  |  |  |
| `products[].shortDescription` | text | yes |  | ≤ 140 chars | yes | One line for product cards |
| `products[].description` | text | yes |  |  | yes | Full description for the product page |
| `products[].ingredients` | text[] |  | `[]` |  | yes |  |
| `products[].allergens` | string[] |  | `[]` | items: `gluten`, `skorupiaki`, `jaja`, `ryby`, `orzeszki ziemne`, `soja`, `mleko`, `orzechy`, `seler`, `gorczyca`, `sezam`, `dwutlenek siarki`, `łubin`, `mięczaki` |  | EU allergens in Polish (14 regulated allergens) |
| `products[].weight` | string |  |  |  | yes | e.g. "ok. 250 g" |
| `products[].images` | [Image](#image)[] | yes |  | ≥ 1 items |  | First image = card + main photo (cut-out preferred) |
| `products[].available` | boolean |  | `true` |  |  |  |
| `products[].featured` | boolean |  | `false` |  |  | Shown where a section uses source.mode = "featured" |
| `products[].badge` | string |  |  | ≤ 20 chars | yes | Small label on the card, e.g. "Bestseller", "Nowość" |
| `products[].seo` | object |  |  |  |  | Search snippet of the product page; omit a field to fall back to name / shortDescription |
| `products[].seo.title` | text |  |  | ≤ 70 chars | yes | <title> of /produkt/<slug> WITHOUT the " \| Słodko Mi" suffix that site.seo.titleTemplate adds (12 chars) — keep it ≤ 48 chars so the full title stays ≤ 60. Name the search phrase, e.g. "Cynamonka Oreo z kremem i czekoladą – Poznań". Defaults to `name`. |
| `products[].seo.description` | text |  |  | ≤ 170 chars | yes | Meta description of /produkt/<slug> (≤ 155 chars recommended): only facts from this product + where to get it. Defaults to `shortDescription`. |

### `src/data/reviews.json` (read-only, never translated)

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `source` | `"google"` | yes |  |  | — |  |
| `rating` | number | yes |  | 1–5 | — |  |
| `count` | integer | yes |  | ≥ 0 | — |  |
| `fetchedAt` | string | yes |  |  | — | ISO date of the last refresh |
| `items` | object[] | yes |  |  | — |  |
| `items[].author` | text | yes |  |  | — |  |
| `items[].rating` | integer | yes |  | 1–5 | — |  |
| `items[].text` | text | yes |  |  | — |  |
| `items[].relativeTime` | string |  |  |  | — | As shown by Google, e.g. "2 miesiące temu" |
| `items[].publishTime` | string |  |  | pattern `^\d{4}-(0[1-9]\|1[0-2])(-\d{2}(T\S+)?)?$` | — | When the review was posted: ISO date/time from Google, or "YYYY-MM" when only the month is known. Shown as month + year. |
| `items[].authorPhoto` | string |  |  | format: uri | — |  |
| `items[].authorUrl` | string |  |  | format: uri | — |  |

### `src/data/pages/<name>.json`

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `path` | string | yes |  | pattern `^\/([a-z0-9-]+\/?)*$` |  | URL path of the page. Every file in src/data/pages becomes a pre-rendered route. |
| `seo` | [Seo](#seo) | yes |  |  |  |  |
| `sections` | object[] | yes |  | ≥ 1 items |  | Ordered list of blocks — reorder, add, remove or disable to change page structure |

### Section types

Every item of `sections[]` is one of these shapes, chosen by `type`. Common fields: `id` (unique on the page, also the
`#anchor`), `type`, `enabled` (default `true`).

#### `hero`

Top hero block in a rounded frame

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"hero"` | yes |  |  |  |  |
| `headline` | object[] | yes |  | 1–4 items |  | Huge display headline, one entry per line |
| `headline[].text` | text | yes |  |  | yes |  |
| `headline[].accent` | boolean |  | `false` |  |  | true = highlighted colour |
| `description` | text |  |  |  | yes | Short supporting sentence under the headline |
| `image` | [Image](#image) | yes |  |  |  | Main hero image — ideally a cut-out PNG/WebP with transparent background |
| `note` | object |  |  |  |  | Small annotation top-right with a hand-drawn arrow pointing at the image |
| `note.title` | text | yes |  |  | yes |  |
| `note.subtitle` | string |  |  |  | yes |  |
| `aside` | string |  |  |  | yes | Short paragraph on the right side of the hero |
| `primaryCta` | [Cta](#cta) | yes |  |  |  |  |
| `secondaryCta` | [Cta](#cta) |  |  |  |  | Rendered as a round icon button next to the primary one |
| `spotlight` | object |  |  |  |  |  |
| `spotlight.label` | text | yes |  |  | yes | Caption above the mini card, e.g. "Bestseller" |
| `spotlight.productSlugs` | string[] | yes |  | ≥ 1 items |  | Slugs from products.json shown in the mini carousel (bottom-right) |
| `ticker` | text[] |  | `[]` |  | yes | Phrases scrolling in the marquee strip at the bottom of the hero |

#### `about`

Centered statement: big heading, paragraph(s), CTA, floating photos

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"about"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"cream"` |  |  |  |
| `heading` | text | yes |  |  | yes |  |
| `sticker` | text |  |  | ≤ 32 chars | yes | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `body` | text[] | yes |  | ≥ 1 items | yes | Paragraphs |
| `images` | [Image](#image)[] |  | `[]` | ≤ 2 items |  | Up to two small floating photos on the left and right |
| `cta` | [Cta](#cta) |  |  |  |  |  |

#### `split`

Two-column block: full-bleed photo/video with big words + coloured panel with product

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"split"` | yes |  |  |  |  |
| `left` | object | yes |  |  |  |  |
| `left.title` | text[] | yes |  | 1–3 items | yes | Big white words over the photo/video, one per line |
| `left.image` | [Image](#image) | yes |  |  |  |  |
| `left.video` | [Video](#video) |  |  |  |  | If set, plays instead of the image |
| `right` | object | yes |  |  |  |  |
| `right.tone` | [Tone](#tone) |  | `"caramel"` |  |  |  |
| `right.heading` | text | yes |  |  | yes |  |
| `right.image` | [Image](#image) | yes |  |  |  | Cut-out product image |
| `right.caption` | text | yes |  |  | yes |  |
| `right.cta` | [Cta](#cta) |  |  |  |  |  |

#### `productGrid`

Grid of product cards from products.json

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"productGrid"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"cream"` |  |  |  |
| `heading` | text | yes |  |  | yes |  |
| `sticker` | text |  |  | ≤ 32 chars | yes | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `intro` | string |  |  |  | yes |  |
| `source` | object |  | `{"mode":"all"}` |  |  | Which products to show |
| `source.mode` | `"all"` \| `"featured"` \| `"category"` \| `"manual"` | yes |  |  |  |  |
| `source.category` | text | yes |  |  |  | Only in the shape with { mode, category }. |
| `source.slugs` | text[] | yes |  | ≥ 1 items |  | Only in the shape with { mode, slugs }. |
| `limit` | integer |  |  | > 0 |  |  |
| `cta` | [Cta](#cta) |  |  |  |  |  |

#### `reviews`

Google reviews carousel (data from reviews.json, refreshed by npm run reviews:fetch)

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"reviews"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"cream"` |  |  |  |
| `heading` | text | yes |  |  | yes |  |
| `sticker` | text |  |  | ≤ 32 chars | yes | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `backgroundImage` | [Image](#image) | yes |  |  |  |  |
| `maxItems` | integer |  | `5` | 1–10 |  |  |
| `minRating` | integer |  | `4` | 1–5 |  | Hide reviews below this star rating |
| `readAllLabel` | text |  | `"Wszystkie opinie w Google"` |  | yes |  |
| `writeLabel` | text |  | `"Napisz opinię"` |  | yes | Shown only when site.links.writeReview is set |
| `notice` | text |  | `"Opinie pochodzą z Map Google. Pokazujemy wybrane opinie z oceną 4–5 gwiazdek. Nie wery…` |  | yes | Required information on where reviews come from and whether they are verified (EU Omnibus directive) |

#### `visit`

Address, entrance hint, opening hours, phone, map and route button (data from site.json)

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"visit"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"blush"` |  |  |  |
| `heading` | text | yes |  |  | yes |  |
| `sticker` | text |  |  | ≤ 32 chars | yes | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `intro` | string |  |  |  | yes |  |
| `image` | [Image](#image) |  |  |  |  | Photo of the place / team |
| `showMap` | boolean |  | `true` |  |  | Google Map loads only after a click (privacy + speed) |
| `ctas` | [Cta](#cta)[] |  | `[{"label":"Wyznacz trasę","href":"@directions","variant":"primary"},{"label":"Zadzwoń",…` | ≤ 4 items |  | Buttons under the address/hours card |

#### `gallery`

Photo collage / Instagram teaser

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"gallery"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"cream"` |  |  |  |
| `heading` | text | yes |  |  | yes |  |
| `sticker` | text |  |  | ≤ 32 chars | yes | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `intro` | string |  |  |  | yes |  |
| `images` | [Image](#image)[] | yes |  | 3–8 items |  |  |
| `cta` | [Cta](#cta) |  |  |  |  |  |

#### `faq`

Questions & answers (also emitted as FAQPage structured data)

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"faq"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"cream"` |  |  |  |
| `heading` | text | yes |  |  | yes |  |
| `sticker` | text |  |  | ≤ 32 chars | yes | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `items` | object[] | yes |  | ≥ 1 items |  |  |
| `items[].question` | text | yes |  |  | yes |  |
| `items[].answer` | text | yes |  |  | yes |  |

#### `cta`

Bold banner with heading and buttons

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"cta"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"brand"` |  |  |  |
| `heading` | text | yes |  |  | yes |  |
| `text` | string |  |  |  | yes |  |
| `primaryCta` | [Cta](#cta) | yes |  |  |  |  |
| `secondaryCta` | [Cta](#cta) |  |  |  |  |  |
| `image` | [Image](#image) |  |  |  |  |  |
| `marquee` | string |  |  |  | yes | Text of the decorative curved band; omit to use site.tagline, "" hides the band |

#### `text`

Plain text page content (privacy policy, about, etc.)

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | string | yes |  | `a-z`, `0-9`, `-` |  | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | `true` |  |  | false hides the section without deleting it |
| `type` | `"text"` | yes |  |  |  |  |
| `tone` | [Tone](#tone) |  | `"cream"` |  |  |  |
| `heading` | string |  |  |  | yes |  |
| `blocks` | object[] | yes |  | ≥ 1 items |  |  |
| `blocks[].kind` | `"paragraph"` \| `"subheading"` \| `"list"` | yes |  |  |  |  |
| `blocks[].text` | text | yes |  |  | yes | Only in the shape with { kind, text } or { kind, text }. |
| `blocks[].items` | text[] | yes |  | ≥ 1 items | yes | Only in the shape with { kind, items }. |

### Shared types

#### Href

Link target. Internal path ("/produkt/oreo", "/#smaki"), absolute URL, or a token resolved from site.json: @order (Wolt), @phone, @directions (Google Maps route), @instagram, @facebook, @reviews (Google reviews), @writeReview. Prefer tokens — they are tracked automatically (Meta Pixel + GA4). A bare "#id" only links within the same page file; site.json and products.json render on many pages, so they must use "/#id". The target section must exist and be enabled.

Type: string (non-empty)

#### Cta

Call-to-action button

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `label` | text | yes |  |  | yes | Button text (Polish, short, uppercase is styled automatically) |
| `href` | [Href](#href) | yes |  |  |  |  |
| `variant` | `"primary"` \| `"secondary"` \| `"light"` |  | `"primary"` |  |  | primary = filled brand, secondary = outline, light = cream fill (for dark backgrounds) |

#### Image

Responsive image (WebP, 480/600/720/960/1600 px variants generated automatically)

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `src` | text | yes |  |  |  | Image key = path inside public/images WITHOUT size suffix and extension, e.g. "products/oreo" or "photos/zespol". Must exist in src/generated/images.json (run `npm run images` after adding a file to assets/images). |
| `alt` | text | yes |  |  | yes | Polish alt text describing the image (accessibility + SEO) |
| `aiGenerated` | boolean |  | `false` |  |  | true = AI-generated illustration, not a real photo of the product/place; it is shown with a visible "Ilustracja" label |

#### Video

Short muted background video with an image poster

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `src` | text | yes |  |  |  | Path inside public/, e.g. "video/przekroj.mp4" (muted, looped, autoplay when visible) |
| `poster` | [Image](#image) | yes |  |  |  |  |

#### NavLink

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `label` | text | yes |  |  | yes |  |
| `href` | [Href](#href) | yes |  |  |  |  |

#### Seo

| Field | Type | Req. | Default | Rules | i18n | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `title` | text | yes |  | ≤ 70 chars | yes | <title> (max ~60 chars recommended) |
| `description` | text | yes |  | ≤ 170 chars | yes | Meta description (max ~155 chars recommended) |
| `ogImage` | string |  |  |  |  | Image key for social previews (defaults to site.seo.ogImage) |
| `noindex` | boolean |  | `false` |  |  |  |

#### Tone

Colour scheme of a block: cream (light), blush (soft pink), brand (raspberry, light text), ink (chocolate, light text), caramel (warm yellow)

Type: `"cream"` | `"blush"` | `"brand"` | `"ink"` | `"caramel"`

<!-- END GENERATED -->
