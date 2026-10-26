# Content schemas

> Generated from `src/content/schema.ts` by `npm run content:schema` — do not edit by hand.
> `npm run content:check` fails when these files are out of date.

JSON Schema (draft 2020-12) of every editable content file. The data files point at them via `$schema`,
so editors (VS Code, Cursor…) autocomplete and validate while you type. Cross-file rules (image keys exist,
product slugs and internal links resolve, section ids are unique) are checked by `npm run content:check`.

| Schema | Files |
| --- | --- |
| [`site.schema.json`](./site.schema.json) | `src/data/site.json` |
| [`catalog.schema.json`](./catalog.schema.json) | `src/data/products.json` |
| [`reviews.schema.json`](./reviews.schema.json) | `src/data/reviews.json` |
| [`page.schema.json`](./page.schema.json) | `src/data/pages/*.json` |

## Link targets

Every `href` accepts an internal path (`/`, `/o-nas`, `/#smaki`, `/produkt/<slug>`), an absolute URL, `tel:`/`mailto:`
or a token resolved from `site.json`: `@order`, `@phone`, `@directions`, `@instagram`, `@facebook`, `@reviews`, `@writeReview`.

## Section types

A page is an ordered list of sections (`sections[]`). Each one has `id` (unique, also the `#anchor`), `type`
and `enabled` (false hides it). Available types:

### `hero`

Top hero block in a rounded frame

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "hero" | yes |  |
| `headline` | { text: string, accent: boolean }[] | yes | Huge display headline, one entry per line |
| `description` | string |  | Short supporting sentence under the headline |
| `image` | Image | yes | Main hero image — ideally a cut-out PNG/WebP with transparent background |
| `note` | { title: string, subtitle: string } |  | Small annotation top-right with a hand-drawn arrow pointing at the image |
| `aside` | string |  | Short paragraph on the right side of the hero |
| `primaryCta` | Cta | yes |  |
| `secondaryCta` | Cta |  | Rendered as a round icon button next to the primary one |
| `spotlight` | { label: string, productSlugs: string[] } |  |  |
| `ticker` | string[] |  | Phrases scrolling in the marquee strip at the bottom of the hero (default: `[]`) |

### `about`

Centered statement: big heading, paragraph(s), CTA, floating photos

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "about" | yes |  |
| `tone` | Tone |  | (default: `"cream"`) |
| `heading` | string | yes |  |
| `sticker` | string |  | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `body` | string[] | yes | Paragraphs |
| `images` | Image[] |  | Up to two small floating photos on the left and right (default: `[]`) |
| `cta` | Cta |  |  |

### `split`

Two-column block: full-bleed photo/video with big words + coloured panel with product

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "split" | yes |  |
| `left` | { title: string[], image: Image, video: Video } | yes |  |
| `right` | object | yes |  |
| `right.tone` | Tone |  | (default: `"caramel"`) |
| `right.heading` | string | yes |  |
| `right.image` | Image | yes | Cut-out product image |
| `right.caption` | string | yes |  |
| `right.cta` | Cta |  |  |

### `productGrid`

Grid of product cards from products.json

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "productGrid" | yes |  |
| `tone` | Tone |  | (default: `"cream"`) |
| `heading` | string | yes |  |
| `sticker` | string |  | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `intro` | string |  |  |
| `source` | { mode: "all" } \| { mode: "featured" } \| { mode: "category", category: string } \| { mode: "manual", slugs: string[] } |  | Which products to show (default: `{"mode":"all"}`) |
| `limit` | integer |  |  |
| `cta` | Cta |  |  |

### `reviews`

Google reviews carousel (data from reviews.json, refreshed by npm run reviews:fetch)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "reviews" | yes |  |
| `tone` | Tone |  | (default: `"cream"`) |
| `heading` | string | yes |  |
| `sticker` | string |  | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `backgroundImage` | Image | yes |  |
| `maxItems` | integer |  | (default: `5`) |
| `minRating` | integer |  | Hide reviews below this star rating (default: `4`) |
| `readAllLabel` | string |  | (default: `"Wszystkie opinie w Google"`) |
| `writeLabel` | string |  | Shown only when site.links.writeReview is set (default: `"Napisz opinię"`) |
| `notice` | string |  | Required information on where reviews come from and whether they are verified (EU Omnibus directive) (default: `"Opinie pochodzą z Map Google. Pokazujemy wybrane opinie z oceną 4–5 gwiazdek. Nie weryfikujemy, czy ich autorzy kupili nasze produkty."`) |

### `visit`

Address, entrance hint, opening hours, phone, map and route button (data from site.json)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "visit" | yes |  |
| `tone` | Tone |  | (default: `"blush"`) |
| `heading` | string | yes |  |
| `sticker` | string |  | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `intro` | string |  |  |
| `image` | Image |  | Photo of the place / team |
| `showMap` | boolean |  | Google Map loads only after a click (privacy + speed) (default: `true`) |
| `ctas` | Cta[] |  | Buttons under the address/hours card (default: `[{"label":"Wyznacz trasę","href":"@directions","variant":"primary"},{"label":"Zadzwoń","href":"@phone","variant":"secondary"},{"label":"Zamów na Wolt","href":"@order","variant":"secondary"}]`) |

### `gallery`

Photo collage / Instagram teaser

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "gallery" | yes |  |
| `tone` | Tone |  | (default: `"cream"`) |
| `heading` | string | yes |  |
| `sticker` | string |  | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `intro` | string |  |  |
| `images` | Image[] | yes |  |
| `cta` | Cta |  |  |

### `faq`

Questions & answers (also emitted as FAQPage structured data)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "faq" | yes |  |
| `tone` | Tone |  | (default: `"cream"`) |
| `heading` | string | yes |  |
| `sticker` | string |  | Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA" |
| `items` | { question: string, answer: string }[] | yes |  |

### `cta`

Bold banner with heading and buttons

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "cta" | yes |  |
| `tone` | Tone |  | (default: `"brand"`) |
| `heading` | string | yes |  |
| `text` | string |  |  |
| `primaryCta` | Cta | yes |  |
| `secondaryCta` | Cta |  |  |
| `image` | Image |  |  |
| `marquee` | string |  | Text of the decorative curved band; omit to use site.tagline, "" hides the band |

### `text`

Plain text page content (privacy policy, about, etc.)

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique id within the page; also used as the #anchor for navigation links |
| `enabled` | boolean |  | false hides the section without deleting it (default: `true`) |
| `type` | "text" | yes |  |
| `tone` | Tone |  | (default: `"cream"`) |
| `heading` | string |  |  |
| `blocks` | ({ kind: "paragraph", text: string } \| { kind: "subheading", text: string } \| { kind: "list", items: string[] })[] | yes |  |
