# Troubleshooting

Messages are quoted as the tools print them. Content errors have the form `<file> → <path>: <message>`, where `<path>`
is the key path inside the file (`sections.3.items.0.answer` = 4th section, its first item's answer). The MCP server and
`npm run ai` print the same messages and roll the change back automatically.

- [Content validation (`npm run content:check`)](#content-validation-npm-run-contentcheck)
- [Translations](#translations)
- [Consent / trackers](#consent--trackers)
- [Schema and generated files](#schema-and-generated-files)
- [Build and postbuild](#build-and-postbuild)
- [Images and fonts](#images-and-fonts)
- [LLM tools (MCP, `npm run ai`, GitHub Action)](#llm-tools-mcp-npm-run-ai-github-action)
- [Reviews](#reviews)
- [Deploy and hosting](#deploy-and-hosting)
- [In the browser](#in-the-browser)

## Content validation (`npm run content:check`)

### Schema errors (wrong field, type or value)

| Message | Cause → fix |
| --- | --- |
| `Unrecognized key: "visible"` | Field does not exist (typo or invented). Use the schema's name (`enabled`) — see [CONTENT-REFERENCE.md](CONTENT-REFERENCE.md#field-reference-generated). |
| `Invalid input: expected string, received undefined` | A required field is missing (e.g. `heading`). Add it. |
| `Invalid input: expected number, received string` | `"price": "24 zł"` → `"price": 24`. Same for `true`/`false` written as strings. |
| `Invalid option: expected one of "cream"\|"blush"\|…` | Value outside the allowed list (`tone`, `variant`, `unit`, allergens…). Pick one from the list. |
| `Invalid discriminator value. Expected 'hero' \| 'about' \| …` | Unknown section `type`. Use an existing type or [add a new one](RECIPES.md#add-a-new-section-type-code). |
| `Too big: expected string to have <=70 characters` | Text too long (`seo.title` 70, `seo.description` 170, `shortDescription` 140, `sticker` 32, `badge` 20). Shorten. |
| `Too small: expected string to have >=1 characters` | Empty text where one is required. Write it or remove the optional field. |
| `Must be an internal path ("/…", "#…"), an absolute URL, or one of: @order, …` | Bad `href` (`"smaki"`). Use `/#smaki`, `/o-nas`, `https://…` or a token. |
| `E.164, e.g. +48511228221` | `contact.phone` must be `+48…` without spaces; the spaced form goes to `phoneDisplay`. |
| `HH:MM` | Time must be `"10:00"`, not `"10"` or `"10.00"`. |
| `Invalid ISO date` | `specialHours[].date` must be a real date `YYYY-MM-DD`. |
| `lowercase letters, digits and dashes only` (section `id`) / `Invalid string: must match pattern /^[a-z0-9-]+$/` (`slug`) | Use `o-nas`, `malina-z-kokosem` — no capitals, spaces or Polish letters. |
| `invalid JSON — Unexpected token …` | Broken JSON syntax (trailing comma, missing quote/bracket). The message gives the position; paste the file into a JSON validator or let your editor show the red mark. |

### Cross-reference errors

| Message | Fix |
| --- | --- |
| `image "photos/x" not found in src/generated/images.json (add the file to assets/images and run \`npm run images\`)` | Typo in the key, or the photo is not processed yet: put it in `assets/images/photos/x.jpg`, run `npm run images`. |
| `link "/#menu" → no section with id "menu" on "/"` | Anchor typo, or the section was renamed/deleted. Point the link at an existing `id`. |
| `link "/#opinie" → section "opinie" on "/" is disabled ("enabled": false) — change or remove this link` | You hid a section that is linked from the menu/footer/buttons. Remove or retarget those links in the same edit. |
| `link "/#smaki" → section "smaki" on "/" shows no products — change or remove this link` | The product grid selects nothing (bad `manual` slugs, empty category, no `featured` products). Fix `source`. |
| `link "#smaki" is shown on every page — use "/#smaki" …` | In `site.json` / `products.json` a section link needs the page path: `/#smaki`. |
| `link "/o-nas" → no page with path "/o-nas"` | Page does not exist — create `src/data/pages/o-nas.json` or fix the link. |
| `link "/produkt/x" → unknown product "x"` | Product slug typo or product removed. |
| `"@facebook" used but site.links.facebook is empty` (also `@writeReview`) | Set the link in `site.json → links` or stop using the token. |
| `product "x" does not exist` / `spotlight product "x" does not exist` / `category "x" does not exist` | Slugs in `productGrid.source` or `hero.spotlight` must exist in `products.json`. |
| `Unknown category "x"` / `Duplicate slug "x"` | `products[].category` must be a `categories[].slug`; slugs are unique. |
| `Duplicate section id "x"` | Two sections on one page share an `id`. Rename one (and its links/translations). |
| `the first enabled section must be "hero" or a "text" section with a heading (it renders the page <h1>)` | Move the hero back to the top, or start the page with a `text` section that has a `heading`. |
| `at most one "hero" section per page` / `the "hero" section must be the first enabled section` | One hero per page, first. |
| `"/produkt…" is reserved for product pages` | Choose another page path. |
| `"/x" is already used by src/data/pages/y.json` | Two page files with the same `path`. |
| `no page with path "/" (home page)` | `home.json` must keep `"path": "/"`. |
| `video "public/video/x.mp4" does not exist` | Put the file into `public/video/` or fix `video.src`. |
| `seo.ogImage: "og/x" not found in images` | Process the image (`npm run images`) or use an existing key. |
| `"closes" (09:00) must be later than "opens" (10:00); midnight is "00:00"` | Fix the time; overnight hours are not supported (close at `"00:00"`). |
| `Day "Mo" appears in more than one hours entry` / `Date "…" appears in more than one entry` | Each weekday once in `hours`, each date once in `specialHours`. |
| `theme.colors: brandDeep on cream has contrast 3.71:1, needs ≥ 4.5:1 (WCAG AA)` | Colour pair not readable. Darken/lighten until the build passes (pairs in [CONTENT-REFERENCE.md](CONTENT-REFERENCE.md#theme-colours-and-contrast)). |

## Translations

All in `src/data/i18n/<locale>/…` (see [I18N.md](I18N.md)).

| Message | Fix |
| --- | --- |
| `taglin: unknown key — translations may only contain keys that exist in the default language` | Typo, or a key the Polish file does not have. Note: keys of `ui` exist even when the Polish `site.json` leaves them to the defaults. |
| `links: settings are not translated — remove this key from the translation file` (also `theme`, `i18n`, `geo`, `hours`, `contact`, `allergens`, `source`) | Delete that whole object from the overlay. |
| `legalName: "legalName" is not translatable — remove it from the translation file` (any technical key: `href`, `src`, `type`, `tone`, `variant`, `date`…) | Delete the key. |
| `products.oreo.price: numbers and true/false are settings — remove them from the translation file` | Delete numbers/booleans (`price`, `enabled`, `featured`, `aiGenerated`…). |
| `sections: item "menu" does not exist in the default language` | The overlay has a section/product/category whose `id`/`slug` is not in the Polish file (deleted or renamed). Delete or rename it. |
| `sections: item without "id"/"slug" does not exist in the default language` | Each item of `sections`, `products`, `categories` in an overlay must contain its `id` / `slug`. |
| `…items: has 7 items, the default language has 6` | A positional array is longer than the Polish one. Remove the extra item (and re-align the order). |
| `nav: expected an array (as in the default language)` (also `expected an object`, `expected text`) | Same shape as the Polish file. |
| `src/data/i18n/en/pages/o-nas.json: no page "o-nas.json" in src/data/pages` | Overlay file name must match a Polish page file. Delete or rename it. |
| `src/data/i18n/de: not a translation language in site.json → i18n.locales (or it is the default language)` | Add the language to `site.json → i18n.locales` or delete the folder. |
| `… (merged with the default language) → tagline: Too small: expected string to have >=1 characters` | The overlay sets a required text to `""`. Write the text or leave the key out. |

Not an error, but looks like one: **a text shows in Polish on `/en/`** — it is missing from the overlay (`npm run i18n:status
-- en --missing`). **A translation sits on the wrong FAQ item / nav link / special day** — a position-matched array changed
in Polish; re-align the overlay. **An old translation after a Polish edit** — overlays are not invalidated; update them.

## Consent / trackers

```
✗ Consent texts do not name every enabled tracker:
  • VITE_TIKTOK_PIXEL_ID is set, but "TikTok" is not named in site.json → consent (text, analyticsText or marketingText)
  • VITE_GTM_ID is set, but "Google Tag Manager" is not named in the privacy policy (/polityka-prywatnosci)
```

An ID is set (shell, `.env`, `.env.local` or the CI variables) but the vendor is not named. Name it with its purpose in
the banner texts and the privacy policy (Polish; update the translations too), or unset the ID. See
[TRACKING.md](TRACKING.md#configuration).

## Schema and generated files

| Message | Fix |
| --- | --- |
| `✗ schema/ is out of date (schema/page.schema.json, …). Run \`npm run content:schema\` and commit the result.` | `src/content/schema.ts` changed. Run it, commit `schema/`. Then `npm run docs:reference`. |
| `✗ docs/CONTENT-REFERENCE.md is out of date — run \`npm run docs:reference\`` | Same, for the generated field tables. |
| `✗ docs/CONTENT-REFERENCE.md has no "<!-- BEGIN GENERATED …" markers` | Someone deleted the markers; restore `<!-- BEGIN GENERATED: npm run docs:reference -->` and `<!-- END GENERATED -->` at the end of the file. |
| TypeScript: `Property 'steps' is missing in type '{ hero: …' but required in type 'Registry'` | A section type was added to the schema but not registered in `src/sections/registry.tsx`. |

## Build and postbuild

`npm run build` stops at the first failing step: content check → `vite-react-ssg build` → `scripts/postbuild.ts`.

| Message | Fix |
| --- | --- |
| `Content validation failed: • …` (Vite) | Same as `content:check`; fix the listed content. |
| `✗ postbuild: SITE_URL https://… does not match VITE_BASE "/x/" — fix one of them` | The path part of `SITE_URL` must equal `VITE_BASE` (`https://example.pl/slodkomi` ↔ `/slodkomi/`; domain root ↔ `/`). |
| `⚠ SITE_URL is not set, so canonical URLs, sitemap and og:url use site.json url …` | Fine locally. For a deploy set `SITE_URL` (GitHub variable, or `.env.local` for a manual build). |
| `⚠ /polityka-prywatnosci: the privacy policy names no NIP …` | Owner to-do: add the controller's full business name and NIP/REGON to the privacy policy. |
| `<file>: <html lang="…"> — expected "en" for this URL` | A component sets the language wrongly; `<html lang>` comes from `Layout` → `useContent().lang`. |
| `<file>: links to another language version (/produkt/oreo/) — internal links must keep the "en" prefix` | A component renders an internal link without `SmartLink` / `c.localize()`, or content has a hardcoded prefixed URL. |
| `<url>: no hreflang alternate for …` / `hreflang="…" → … does not link back` | A page exists in one language but not another, or `Seo` was bypassed. Every page must render `Seo`. |
| `<file>: N <h1> elements (expected exactly 1)` | A page must have one `<h1>`: hero headline or the first `text` heading; components use `h2`/`h3`. |
| `<file>: invalid JSON-LD` / `JSON-LD …` | A JSON-LD builder in `src/lib/schema-org.ts` produced invalid or incomplete data. |
| `⚠ og:image … is not in the build (run npm run images)` | Generated images are missing — run `npm run images` and commit `public/images/`. |
| `(!) Some chunks are larger than 500 kB after minification` | Expected (one bundle by design, content of all languages inlined); not an error. |
| `ENOENT … .vite-react-ssg-temp` or odd errors during parallel builds | Two builds into the same folder. Use `OUT_DIR=.tmp/<name>/dist` per build. |

## Images and fonts

- **`npm run images` fails to load `sharp`** — reinstall dependencies: `rm -rf node_modules && npm ci` (sharp downloads
  a binary for your OS/CPU).
- **A replaced photo does not change** — the pipeline skips outputs newer than the source. Touch the source
  (`touch assets/images/x/y.jpg`) or delete `public/images/x/y-*.webp`, then `npm run images`.
- **Social preview of a cut-out still has the old background colour** — `rm public/images/*/*-og.jpg && npm run images`.
- **Image works locally but not on the site** — `public/images/` and `src/generated/images.json` were not committed.
- **Letters in a headline look different / wrong font** — the letter is outside the font subsets (only Latin-1, Polish
  and Russian/Ukrainian Cyrillic). See [I18N.md → Adding a language](I18N.md#adding-a-language) (fonts).
- **`pyftsubset: command not found`** (`scripts/subset-fonts.sh`) — `pip install fonttools brotli`.

## LLM tools (MCP, `npm run ai`, GitHub Action)

| Symptom / message | Fix |
| --- | --- |
| Claude Desktop: `spawn npx ENOENT` | Use the full node path in the MCP config — see [LLM-EDITING.md](LLM-EDITING.md#2-mcp-сервер). |
| MCP: `"x" is not a content file. Allowed: …` | Only `src/data/site.json`, `products.json`, `pages/<name>.json` and `i18n/<locale>/…` can be written. |
| MCP: `src/data/reviews.json is read-only …` | By design. Reviews come only from `npm run reviews:fetch`. |
| MCP: `Rolled back — <file> was NOT changed. The change introduces N error(s): …` | The edit was invalid and nothing was written; fix according to the errors and retry. |
| MCP: `<file> does not pass validation … — fix that file first or in the same change` | Another content file is already broken; fix it first (`validate_content`). |
| MCP: `src/generated/images.json is broken — run \`npm run images\` before editing content` | Regenerate the manifest. |
| `npm run ai`: `Set LLM_API_KEY (or ANTHROPIC_API_KEY) — e.g. in .env.local` / `Set LLM_MODEL for LLM_PROVIDER=openai …` | Configure the provider (see LLM-EDITING.md, section 3). |
| `npm run ai`: `No valid edit after 3 repair rounds — nothing was changed.` | The model could not produce a valid edit: split the instruction, give missing facts, or use a stronger model. |
| `npm run ai`: `The answer was cut off (max_tokens)` / `(finish_reason: length)` | Instruction too large (e.g. translating everything at once): do one language or one file per run. |
| Local model answers nonsense / not JSON | Context too small or model too small: see the Ollama/LM Studio notes in LLM-EDITING.md. |
| GitHub Action finishes but no pull request | The model changed nothing (see the run's Summary) or "Allow GitHub Actions to create and approve pull requests" is off. |

## Reviews

| Message | Fix |
| --- | --- |
| `✗ GOOGLE_PLACES_API_KEY is not set …` | Add the key to `.env.local` (local) or the repository secret (workflow). |
| `✗ Places API 403 …` | Enable "Places API (New)" for the key's Google Cloud project, check billing and key restrictions. |
| `✗ No Google place found for "…". Set GOOGLE_PLACE_ID manually.` | Set `GOOGLE_PLACE_ID` (find it with Google's Place ID finder). |
| Workflow "Refresh Google reviews" shows "skipping" | The secret `GOOGLE_PLACES_API_KEY` is not set — reviews then simply stay as they are. |

## Deploy and hosting

| Symptom | Fix |
| --- | --- |
| Deploy job error `Set the repository variable SITE_URL …` | Add the variable `SITE_URL` (Settings → Secrets and variables → Actions → Variables). |
| Notice `FTP_SERVER secret is not set — skipping the FTP deploy` | FTP not configured; only the GitHub Pages preview is published. |
| FTP upload fails with TLS errors | Host without FTPS: variable `FTP_PROTOCOL=ftp` (only if the host really has no TLS). |
| Whole site answers **500 Internal Server Error** | The host forbids `Options` in `.htaccess`: delete the line `Options -Indexes -MultiViews` in `public/.htaccess`. |
| Pages work, but missing URLs show Apache's own 404 / wrong language | `ErrorDocument` paths in `.htaccess` do not match the deploy folder (sub-folder deploy) — see [DEPLOY.md](DEPLOY.md). |
| CSS/JS 404 after deploying into a sub-folder | Build with `VITE_BASE=/<folder>/` and `SITE_URL` ending in `/<folder>`. |
| GitHub Pages preview shows a blank page or 404 | Settings → Pages → Source must be "GitHub Actions"; the preview lives at `/SLODKO-MI/`. |
| Old version still visible after deploy | HTML is `no-cache`, assets are hashed — hard-reload once. An open tab recovers by itself (`RouteError` reloads once on a failed navigation). |

## In the browser

- **I get redirected to `/en/`** — automatic language detection on the first visit (browser language not Polish). Choose
  Polski in the switcher (remembered) or clear `localStorage['slodkomi-lang']` and `sessionStorage`.
- **No cookie banner** — no tracker ID is configured, so nothing needs consent; "Ustawienia cookies" in the footer still
  opens it.
- **Analytics shows nothing** — consent not given, ad blocker, or IDs not set at build time. Debug with
  `?debug_analytics=1` ([TRACKING.md](TRACKING.md#debugging)).
- **"Otwarte teraz" wrong** — it uses the shop's time zone (Europe/Warsaw) and `hours` + today's `specialHours`; check
  the data.
- **A special day does not show** — only dates from today through the next 14 days are listed.
- **Lighthouse below 95 locally** — `vite preview` serves without the hosting's compression/caching and extensions skew
  results; use an incognito window or the CLI command in [RECIPES.md](RECIPES.md#check-performance-lighthouse), run it
  2–3 times, and compare with the deployed site.
