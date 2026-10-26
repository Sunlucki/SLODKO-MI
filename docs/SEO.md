# SEO

Technical SEO is built in and checked on every build; content SEO (titles, descriptions, copy) is data. The keyword
research per language and page is in [SEO-KEYWORDS.md](SEO-KEYWORDS.md) — use it for every title, description and FAQ.

- [What the site does automatically](#what-the-site-does-automatically)
- [What you edit](#what-you-edit)
- [Structured data (JSON-LD)](#structured-data-json-ld)
- [Build checks](#build-checks)
- [Content gaps (need the owner)](#content-gaps-need-the-owner)
- [Measurement](#measurement)
- [Local SEO checklist for the owner](#local-seo-checklist-for-the-owner) (in Russian)

## What the site does automatically

| Topic | How |
| --- | --- |
| Crawlable HTML | Every page, product and language is pre-rendered with all text, links and images; JS only enhances. |
| URLs | One canonical form with a trailing slash (`/produkt/oreo/`); `.htaccess` 301-redirects the bare form, `www.`, `http` and `…/index.html` in one hop. |
| Languages | `/`, `/en/`, `/ru/`, `/uk/`: `<html lang>`, self-canonical per language, `hreflang` for every language + `x-default` (Polish), `og:locale` + alternates. Internal links stay inside their language. |
| Head tags | `src/components/Seo.tsx`: `<title>` (`site.seo.titleTemplate` = `%s \| Słodko Mi`), meta description, robots, canonical, hreflang, Open Graph and Twitter tags incl. `og:image:alt`. |
| Robots | Indexable pages: `max-image-preview:large`. `seo.noindex: true` pages and 404 pages: `noindex,follow`, no canonical, no hreflang, no `og:url`. |
| Social images | `seo.ogImage` or `site.seo.ogImage` (`og/default`, 1200×630); product pages use their cut-out flattened onto cream (`<key>-og.jpg`). |
| `sitemap.xml` | Every indexable page in every language with `xhtml:link` hreflang alternates; no `lastmod` (the weekly reviews redeploy would mark everything as changed). |
| `robots.txt` | `Allow: /` + sitemap URL. |
| `llms.txt` | Markdown summary for AI search engines: description, rating, address, phone, hours (incl. upcoming special hours), links, flavours (+ prices when shown), pages, other-language versions. |
| 404 | `/404.html` (Polish) and `/<lang>/404.html`, `noindex`, served by Apache with status 404. |
| Language auto-detection | Never for bots (user-agent filter), so crawlers always get the URL they request. |
| Speed / a11y | Lighthouse ≥ 95 target: deferred JS, `content-visibility`, responsive WebP, self-hosted font subsets, one `<h1>`. |

## What you edit

| What | Where | Limits |
| --- | --- | --- |
| Page title / description | `src/data/pages/<name>.json → seo.title`, `seo.description` | title ≤ 48 chars (+ " \| Słodko Mi" = 60), description ≤ 155 |
| Product page title / description | `products.json → products[].seo.title`, `seo.description` (optional; default `name`, `shortDescription`) | same |
| Translated titles / descriptions | `src/data/i18n/<locale>/pages/<name>.json → seo`, `…/products.json → products[].seo` | same, per language |
| Default social image, keywords, title template | `site.json → seo` | — |
| Business data for JSON-LD | `site.json` (name, legalName, description, contact, address, geo, hours, specialHours, priceRange, servesCuisine, links) | facts only |
| Image alt texts | every `{ src, alt }` (and their translations) | describe the picture |
| FAQ (FAQPage markup) | `faq` sections | answers are facts |
| Hide a page from search | `seo.noindex: true` | — |
| Production domain | `SITE_URL` (+ `site.json → url`) — see DEPLOY.md | bare `https://` domain |

Rules of thumb: one main phrase per page (from SEO-KEYWORDS.md), unique titles per language (the build fails on
duplicates), Polish street names in every language, "Wilda", "Hetmańska", "Poznań" where natural; never keyword-stuff the
business name.

## Structured data (JSON-LD)

Built in `src/lib/schema-org.ts`, in the language of the page:

- **Home page:** `Bakery` — one `@id` (`<site>/#bakery`) shared by every language version so search engines see one
  business — with address, geo, phone, opening hours (regular + `specialHours` as dated entries; a closed date is
  `00:00–00:00`), price range, cuisine, `sameAs` (Instagram, Facebook, Google Maps), `hasMap`, `acceptsReservations:
  false`, an `OrderAction` pointing at Wolt, and `hasMenu` → `Menu` → `MenuSection` per category → `MenuItem` per flavour
  (with `Offer` only when prices are shown); plus `WebSite`.
- **Other pages:** `BreadcrumbList`.
- **Any page with an enabled `faq` section:** `FAQPage` (Google shows FAQ rich results only for government/health sites
  since 2023 — the markup stays for other consumers).
- **Product pages:** `MenuItem` (or `Product` + `Offer` when `catalog.showPrices` is true and the product has a price) +
  `BreadcrumbList`.
- **Never:** `aggregateRating` / `review` markup — Google treats it as self-serving for a LocalBusiness and forbids
  re-publishing Google reviews; the build fails if it appears.

Test after a deploy: Google Rich Results Test and the Schema Markup Validator on `/` and a product page.

## Build checks

`scripts/postbuild.ts` fails the build (errors) or warns:

- errors: missing `<title>` / description, a duplicate `<title>` within a language, not exactly one `<h1>`, invalid or
  incomplete JSON-LD (required properties per type, links to pages that are not in the build, review markup), wrong
  `<html lang>`, internal links into another language, incomplete or non-reciprocal hreflang, sitemap URLs that are not
  indexable pages of the build, `SITE_URL` path ≠ `VITE_BASE`;
- warnings: title > 60 / description > 160 characters, missing social meta or `max-image-preview`, canonical different
  from the page URL, `og:image` missing from the build, `.htaccess` `ErrorDocument` lines that do not match the deploy
  base, `SITE_URL` not set, no NIP in the privacy policy.

## Content gaps (need the owner)

From SEO-KEYWORDS.md section 4 — each needs facts only the owner has:

1. **Prices** (only Oreo 24 zł is known) → then `catalog.showPrices: true` (upgrades product markup to Product + Offer).
2. **Weight, kcal, ingredients, allergens per flavour** (people search "kcal" for several flavours).
3. **Directions:** name of the nearest stop, photo of the Hetmańska door, routes from Poznań Główny / Stary Rynek.
4. **Practical FAQ for foreigners:** payment methods (cards/NFC, BLIK), English menu — only if true.
5. **Dietary FAQ:** vegan / gluten-free / lactose-free — an honest "no" also answers the query.
6. **Larger orders and boxes:** minimum quantity, notice, box sizes and prices.
7. **Freshness:** when trays come out, whether flavours sell out.
8. **Trust:** Orły Cukiernictwa 2026 badge — only with the owner's OK.
9. **Real photos** instead of the AI images (hero, malina z kokosem) — also for image search.
10. **Eat-in details:** seating, toilet, Wi-Fi, laptops, accessibility, dogs.

## Measurement

- **Google Search Console:** Domain property for the production domain; submit `https://<domain>/sitemap.xml`; filter
  queries by `/en/`, `/ru/`, `/uk/`; review the keyword map after 4–8 weeks.
- **Google Business Profile → Performance → search terms:** the real words people use, monthly.
- **GA4:** `page_view` has `page_language`; product events use Polish names (see TRACKING.md).

---

## Local SEO checklist for the owner

> Для владельца, простыми словами. Источник со всеми деталями — [SEO-KEYWORDS.md](SEO-KEYWORDS.md), раздел 3.

### Шаг 0 — сначала свой домен

Сейчас сайт живёт на временном адресе GitHub Pages. Сначала подключите свой домен (см. DEPLOY.md / RECIPES.md
«Set the production domain»), и только потом вписывайте адрес сайта в Google и каталоги — иначе все ссылки придётся
переделывать.

### Одинаковые данные везде (NAP)

Название, адрес и телефон пишите **везде одинаково**, буква в букву:

```
Słodko Mi Smakuje Ci?
ul. 28 Czerwca 1956 r. 177/13 (wejście od ul. Hetmańskiej)
61-525 Poznań
+48 511 228 221
```

Часы — те же, что на сайте (`site.json → hours`; сейчас: пн выходной, вт–вс 10:00–19:00).

### Профиль в Google (Google Business Profile)

Ведите по-польски — Google сам переводит профиль для иностранцев, поэтому пишите короткими простыми фразами.

- [ ] **Название** — ровно «Słodko Mi Smakuje Ci?». Не добавляйте «cynamonki Poznań» и т. п. — это нарушает правила Google
  и грозит блокировкой.
- [ ] **Категории** — основная «Cukiernia». Дополнительные — только если это правда (Kawiarnia, piekarnia). Если в
  профиле есть категория «kawiarnia dla psów», а вы просто пускаете с собаками — уберите её и включите атрибут «можно с
  собаками».
- [ ] **Сайт** — ссылка на главную страницу с меткой:
  `https://<домен>/?utm_source=google&utm_medium=organic&utm_campaign=gbp`.
- [ ] **Ссылка на заказ** — Wolt: `https://wolt.com/pl/pol/poznan/restaurant/slodko-mi-smakuje-ci`. Откройте и проверьте,
  что она работает.
- [ ] **Меню / товары** — все 7 вкусов с польскими названиями как на сайте, настоящее фото, цена и ссылка на страницу
  вкуса `https://<домен>/produkt/<slug>/`.
- [ ] **Вход** — фраза «wejście od ul. Hetmańskiej» в первых 250 знаках описания; фото двери на Hetmańskiej с подписью;
  проверьте, что булавка на карте стоит у этого входа.
- [ ] **Особые часы** — переносите из сайта (`site.json → specialHours`); праздники (11.11, Рождество, Новый год)
  заводите заранее.
- [ ] **Атрибуты** — на месте, на вынос, доставка; оплата картой / NFC (уточните BLIK); туалет; собаки (если да); доступ
  для колясок (если да).
- [ ] **Фото** — только настоящие: каждый вкус, зал, вход, команда. Иллюстрации с сайта (главный экран, «malina z
  kokosem») в профиль не ставить. Раз в неделю — фото «dziś na blasze».
- [ ] **Посты** — раз в неделю, по-польски (можно одну строку по-английски): вкус недели со ссылкой на его страницу,
  праздничные часы; перед 11.11 — пост «nie tylko rogale – spróbuj cynamonek z Wildy».
- [ ] **Ответы на отзывы** — на каждый, в течение нескольких дней, на языке автора (PL, EN, UK, RU), упоминая вкус, о
  котором он писал; без копипаста.
- [ ] **Просить отзывы** — QR-код на кассе и на коробках. Никаких скидок/подарков за отзыв — это против правил Google.
  Иностранцев можно попросить оставить отзыв в Google или на TripAdvisor.
- [ ] **Чужой профиль по вашему адресу** — подсказки Google и Too Good To Go связывают «Cukiernia Jagódka» с адресом
  28 Czerwca 177. Если на картах висит её старая карточка — предложите правку, но только убедившись, что она там больше
  не работает.

### Каталоги и внешние сайты (citations)

Везде — те же название, адрес, телефон и часы.

- [ ] **Wolt** (PL + EN) — проверьте ссылку; название, адрес и часы как в Google; те же 7 названий вкусов, фото каждого,
  описание по-польски и по-английски.
- [ ] **Facebook** — короткое имя страницы, категория «Cukiernia», адрес с пометкой про Hetmańską, часы, сайт, ссылка
  на Wolt.
- [ ] **Instagram @slodkomi.poznan** — в описании «Cynamonki · Poznań Wilda · wejście od Hetmańskiej» и ссылка на сайт.
- [ ] **visitpoznan.pl** (PL + EN) — подать заявку в городское туристическое бюро; вероятно, самый ценный каталог.
- [ ] **TripAdvisor** (EN) — создать карточку (bakery / dessert), описание по-английски.
- [ ] **Restaurant Guru** (EN + RU) — забрать профиль, добавить синнабоны и фото (русская версия заполнится сама).
- [ ] **Orły Cukiernictwa** — проверить адрес и сайт в профиле; значок лауреата на сайте — только с вашего согласия.
- [ ] **biznes-top.pl** — копирует данные Google: исправится само, когда исправите профиль Google.
- [ ] **gdziezjescpoznan.com/ru** (RU) и **intravel.net/uk** (UK) — попросить добавить.
- [ ] **gdziejemy.pl, poznaninfo.pl** — попросить включить в списки кафе на Вильде.
- [ ] **Głos Wielkopolski / naszemiasto, mytujemy.pl** — отправить письмо с фото и 7 вкусами (они каждую осень обновляют
  список); блогеры: @foodhunterki, @posen_food.
- [ ] **Apple Business Connect и Bing Places** — забрать карточки (Apple Maps важны для туристов с iPhone).
- [ ] **Too Good To Go** — только если пользуетесь; адрес «177/13», не просто «177».
- [ ] **HappyCow** — только если появится веганский вариант.

### Как понять, что работает

- [ ] **Google Search Console** — подтвердить домен, отправить `sitemap.xml`; через 4–8 недель посмотреть запросы,
  отдельно по `/en/`, `/ru/`, `/uk/`.
- [ ] **Google Business Profile → Эффективность → поисковые запросы** — раз в месяц смотреть, по каким словам вас находят.
