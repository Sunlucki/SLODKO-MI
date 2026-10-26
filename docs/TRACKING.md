# Tracking & consent

Every pixel is optional and switched on by a build-time environment variable. Nothing is sent before the visitor consents in the cookie banner, and no third-party script loads before that.

```
components ──► src/lib/analytics.ts (public API + event mapping)
                     │
                     ▼
               src/lib/tracking/events.ts (consent gate, fan-out, debug log)
                     │
     ┌───────────────┼──────────────────┬──────────────────┐
     ▼               ▼                  ▼                  ▼
 dataLayer.ts     ga4.ts           metaPixel.ts        tiktok.ts      gtm.ts
 (dataLayer,      (gtag.js)        (fbq)               (ttq)          (gtm.js)
  gtag, Consent
  Mode v2)
```

| File | Role |
| --- | --- |
| `src/lib/analytics.ts` | The only module components import. `trackAction`, `trackPageView`, `trackViewItem`, `trackViewItemList`, `trackSelectItem`, `trackEngagement`, plus the consent API used by the banner. |
| `src/lib/tracking/events.ts` | `dispatch()`: drops events without consent, assigns one `event_id`, sends to each allowed destination, logs in debug mode. Reacts to consent changes (re-sends the current page's page view and item views to newly allowed destinations). |
| `src/lib/tracking/consent.ts` | Consent state in `localStorage`, change listeners, the "reopen banner" window event. |
| `src/lib/tracking/dataLayer.ts` | `window.dataLayer`, the `gtag()` shim, Consent Mode v2 default and update. |
| `src/lib/tracking/ga4.ts`, `gtm.ts`, `metaPixel.ts`, `tiktok.ts` | One transport per vendor: stub, lazy script, consent grant/revoke, event call. |
| `src/lib/tracking/loader.ts` | `whenIdle()` (first interaction or idle after `load`) and `loadScript()`. |
| `src/components/consent/CookieBanner.tsx` | The banner (texts from `site.json` → `consent`). |
| `src/components/consent/ConsentSettingsButton.tsx` | "Ustawienia cookies" button that reopens the banner (used in the footer). |

Components never call `gtag`, `fbq` or `ttq` directly. Links rendered with `SmartLink` / `CtaButton` / `IconLink` are tracked automatically from their `@token` or URL (see `src/lib/links.ts`).

## Configuration

Set in `.env` (or the CI environment) **before** `npm run build`. The values are baked into the static files, so a change needs a rebuild and a new upload.

| Variable | Example | Destination |
| --- | --- | --- |
| `VITE_GA_ID` | `G-XXXXXXXXXX` | Google Analytics 4 (gtag.js) |
| `VITE_META_PIXEL_ID` | `123456789012345` | Meta Pixel (Facebook / Instagram ads) |
| `VITE_GTM_ID` | `GTM-XXXXXXX` | Google Tag Manager container |
| `VITE_TIKTOK_PIXEL_ID` | `C0XXXXXXXXXXXXXXXXXX` | TikTok Pixel |

Empty or missing = that destination is disabled (its code is never called). When **every** ID is empty the site sets no optional cookies, so the banner does not appear on its own; "Ustawienia cookies" in the footer still opens it, which is handy for testing the flow.

**Every enabled vendor must be named.** `npm run content:check` (and therefore every build) reads the IDs like the build does (shell, then `.env` / `.env.local`, via Vite's `loadEnv`) and fails when an enabled vendor is not named in `site.json` → `consent` (`text`, `analyticsText` or `marketingText`) **and** in the privacy-policy page (`consent.policyHref`): "Google Analytics" for `VITE_GA_ID`, "Meta" for `VITE_META_PIXEL_ID`, "TikTok" for `VITE_TIKTOK_PIXEL_ID`, "Google Tag Manager" for `VITE_GTM_ID`.

Do not configure GA4 twice: use either `VITE_GA_ID` **or** a GA4 tag inside GTM, not both, or every event is counted twice.

## Consent flow

1. **Before any tag** (`initTracking()`, on the first tracking call or when the banner mounts) the Consent Mode v2 default is pushed:
   `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` = `denied`; `functionality_storage`, `security_storage` = `granted`; `wait_for_update: 500`.
2. **No decision yet** → the banner is shown (if at least one ID is configured). Every event is dropped (not queued; only the current page's page view and item views are re-sent in step 3). No `fbq`/`ttq` objects exist, no script tag is added.
3. **Visitor decides** (Accept all / Only necessary / Settings → two switches → Save):
   - `gtag('consent', 'update', …)`: `analytics_storage` follows *Analytics*; `ad_storage`, `ad_user_data`, `ad_personalization` follow *Marketing*.
   - `dataLayer.push({ event: 'consent_update', consent_analytics, consent_marketing })` for GTM triggers.
   - *Analytics* → GA4 is configured (`send_page_view: false`) and gtag.js loads (basic consent mode: no script without consent).
   - *Marketing* → `fbq('consent', 'grant')`, `fbq('init', id)`, fbevents.js loads; `ttq.load(id)`, `ttq.grantConsent()`, TikTok's events.js loads.
   - *Any* consent → GTM loads.
   - The page view of the current page, dropped in step 2, is sent once, only to the destinations that were just enabled (adding Marketing later does not resend the GA4 page view). The item views of that page (`view_item`, `view_item_list`) follow it the same way, so a visitor who lands on a product and then accepts still counts as a ViewContent.
   - That page view's `page_location` carries the campaign parameters of the landing URL (`utm_*`, `gclid`, `fbclid`, `ttclid`), kept in memory only, so GA4 keeps the campaign when the visitor browsed on before deciding. With *Marketing*, a landing `fbclid` is also written to Meta's `_fbc` cookie (`fb.1.<ms>.<fbclid>`) when the pixel has none yet, because the pixel only reads it from the current URL. TikTok reads `ttclid` from the current URL only.
4. **Returning visitor** → the stored decision is applied right after the default (`consent update`), before the first page view. No banner.
5. **Revocation** (footer → "Ustawienia cookies" → switches off → Save, or "Tylko niezbędne"):
   - `gtag('consent', 'update', denied…)` and `window['ga-disable-<GA_ID>'] = true` (the official GA opt-out: an already loaded gtag.js, including enhanced measurement, sends nothing).
   - `fbq('consent', 'revoke')`, `ttq.revokeConsent()`.
   - Our dispatcher stops calling the vendors. Loaded scripts stay in memory but inert until consent is granted again.

**Storage:** `localStorage['slodkomi-consent'] = { "v": "1:ga,meta", "ts": <ms timestamp>, "analytics": bool, "marketing": bool }`.
`v` is the purpose version plus the vendors this build enables (`ga`, `meta`, `tiktok`, `gtm`). The banner is shown again when the record is older than 12 months, has a different `v` (so adding or removing a pixel ID asks everybody again automatically), or storage is unavailable (private mode, blocked site data; the choice then applies until the tab is closed). To ask everybody again after a change of purposes, bump the number in `VERSION` in `src/lib/tracking/consent.ts`.

**No `<noscript>` pixels.** They would fire without consent.

### Script loading and performance

Scripts are injected by `whenIdle()`: on the first `pointerdown` / `keydown` / `touchstart` / `scroll`, or via `requestIdleCallback` after `load` (2 s timeout fallback in browsers without it), whichever comes first. Calls made before the script arrives wait in the official stub queues (`dataLayer`, `fbq.queue`, `ttq`). A Lighthouse run has no stored consent, so no third-party script is loaded at all.

**Clicks before the app bundle runs.** The bundle itself loads only after the first paint (`scripts/lib/defer-app-script.ts`). Until it has run, the inline loader queues clicks on tracked links and on buttons in `window.__early` (capture phase). After hydration, `replayEarlyClicks()` (`src/lib/analytics.ts`, called from the banner's mount effect) reports each queued link through `trackAction` (from the `data-track`, `data-track-location`, `data-track-product` attributes `SmartLink` renders on tracked links; the usual consent gate applies) and clicks the last queued button once more, so the menu, carousels, map and "Ustawienia cookies" answer a tap made before hydration. Navigations are never replayed: the browser already followed the link. Queueing stops when the bundle has run, because React then handles new clicks itself.

### The banner

- Texts come from `src/data/site.json` → `consent` (title, text, acceptAll, rejectAll, settings, save, analyticsLabel/Text, marketingLabel/Text, policyLabel, policyHref).
- "Akceptuję wszystkie" and "Tylko niezbędne" have identical styles (equal prominence). Switches start off (no pre-ticked boxes).
- Rendered only after mount (not in the pre-rendered HTML → no hydration mismatch), `position: fixed` (no layout shift), non-modal `role="dialog"` with `aria-labelledby` / `aria-describedby`. It works anywhere in the DOM; placed early (before the header) it comes first in the keyboard and screen-reader order.
- While it is open, `scroll-padding-bottom` on `<html>` and `padding-bottom` on `<body>` equal its height (plus its gap to the edge), so a focused element is always scrolled above it, down to the last footer link (WCAG 2.2 SC 2.4.11). Both are removed when it closes.
- Reopened from the footer: settings expanded with the current choice, focus moves to the dialog, Escape closes it unchanged and returns focus to the button. On the first visit Escape only collapses the settings: it never decides for the visitor.

## Event mapping

Every event is also pushed to the dataLayer as `{ event, ...params, event_id }` (only when at least one consent is granted). Item events (`view_item`, `view_item_list`, `select_item`) follow GA4's ecommerce format for GTM instead: `{ ecommerce: null }` first (GTM merges pushes, so this clears the previous items), then `{ event, ecommerce: { currency?, value?, item_list_name?, items }, event_id }`; use GTM's "Send Ecommerce data" or Data Layer Variables `ecommerce.items`. Meta calls pass `{ eventID: event_id }` and TikTok calls `{ event_id }` with the same UUID, so a future Conversions API / Events API integration can deduplicate browser and server events.

| Facade call | GA4 (`gtag('event', …)`) | Meta Pixel | TikTok Pixel |
| --- | --- | --- | --- |
| `trackPageView(path, title)` (Layout, every route) | `page_view` `{ page_location, page_path, page_title }` | `track PageView` | `ttq.page()` |
| `trackViewItem(product)` (product page) | `view_item` `{ currency, value?, items: [{ item_id: slug, item_name, item_category, price? }] }` | `track ViewContent` `{ content_ids: [slug], content_name, content_type: 'product', content_category, currency?, value? }` | `ViewContent` `{ contents: [{ content_id, content_type, content_name, price? }], currency?, value? }` |
| `trackViewItemList(products, listName)` | `view_item_list` `{ item_list_name, items[] (with index) }` | `trackCustom ViewItemList` `{ content_ids, content_type, list_name }` | — |
| `trackSelectItem(product, listName, index)` | `select_item` `{ item_list_name, items: [item with index] }` | `trackCustom SelectItem` `{ content_ids, content_name, list_name, index }` | — |
| `trackAction(click_order)` (`@order`, wolt.com links) | `click_order` `{ provider, location, item_id? }` | `track InitiateCheckout` `{ content_ids?, content_name?, content_type?, currency?, value? }` | `InitiateCheckout` `{ contents?, currency?, value? }` |
| `trackAction(click_phone)` (`@phone`, `tel:`) | `click_phone` `{ location }` | `track Contact` | `Contact` |
| `trackAction(click_directions)` (`@directions`) | `click_directions` `{ location }` | `track FindLocation` | — |
| `trackAction(click_social)` (`@instagram`, `@facebook`) | `click_social` `{ network, location }` | `trackCustom SocialClick` `{ network, location }` | — |
| `trackAction(click_reviews)` (`@reviews`, `@writeReview`) | `click_reviews` `{ kind: 'read' \| 'write', location }` | `trackCustom ReviewsClick` `{ kind, location }` | — |
| `trackEngagement('open_map' \| 'open_faq' \| 'review_navigate' \| 'open_menu' \| 'spotlight_navigate', detail?)` | same name `{ detail? }` | — | — |

Notes:

- `location` is the place of the click passed by the component (`header`, `hero`, `footer`, `product:oreo`, …).
- `currency` is the product's `currency` (PLN). `value` / `price` are sent only when the product has a price **and** `site.catalog.showPrices` is `true`: the site never shares a price it does not publish.
- Optional params that are empty are left out of GA4/Meta/TikTok calls. In the dataLayer they are pushed as `undefined`, which resets the key in GTM's data model (no stale `item_id` from a previous click).
- Register `location`, `provider`, `network`, `kind`, `detail` as custom dimensions in GA4 (Admin → Custom definitions) to see them in reports. Mark `click_order` (and optionally `click_phone`, `click_directions`) as key events.

## Vendor-side settings

- **GA4:** Admin → Data streams → Enhanced measurement → *Page views* → advanced → **turn off "Page changes based on browser history events"**. Page views are sent by the app on every route change; leaving it on double-counts them.
- **Meta Pixel:** the stub sets `fbq.disablePushState = true`, so the pixel does not send its own PageView on SPA navigation. Optional: Events Manager → Settings → disable *Automatic events* if you only want the events above.
- **TikTok Pixel:** check Events Manager for automatic/history-based page views and keep only the manual ones.
- **GTM:** enable Consent Overview and give every tag the right *additional consent checks* (`analytics_storage` for analytics, `ad_storage` + `ad_user_data` for ads). The container loads with *any* consent; the custom `consent_update` event can trigger tags once consent is granted.
- **Legal texts:** the banner (`site.json` → `consent`) and the privacy policy (`src/data/pages/polityka-prywatnosci.json`) must name every enabled vendor and its purpose; the build fails otherwise (see Configuration). *Marketing* grants `ad_storage`, `ad_user_data` and `ad_personalization`, so its text must cover ad measurement **and** ad personalisation/remarketing. Vendors added only inside GTM are not checked: name them in both texts and bump the number in the consent `VERSION`.
- **Content-Security-Policy:** if a CSP header is added (e.g. in `.htaccess`), allow at least `script-src https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com`, `connect-src https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://analytics.tiktok.com` and `img-src https://www.facebook.com https://*.google-analytics.com https://www.googletagmanager.com`.

## Debugging

- Add `?debug_analytics=1` to any URL (or run `npm run dev`): every event is logged to the console as `[analytics] <name> {params} {event_id, sent: [...]}`, dropped events as `[analytics] <name> dropped (no consent)`, plus consent changes. With this flag GA4 is configured with `debug_mode: true`, so events appear in GA4 → Admin → DebugView.
- Inspect `window.dataLayer` in the console; Meta Pixel Helper, TikTok Pixel Helper and Google Tag Assistant work as usual.
- Reset the decision: `localStorage.removeItem('slodkomi-consent')` and reload, or use "Ustawienia cookies" in the footer.

## Adding an event

1. Add a function (or a new `TrackAction` variant) in `src/lib/analytics.ts` that calls `dispatch({ name, params, meta?, tiktok? })`.
2. If it is a link, map its `@token` or URL pattern to the action in `src/lib/links.ts`.
3. Add a row to the table above.
