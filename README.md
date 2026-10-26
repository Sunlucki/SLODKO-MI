# SŁODKO MI — сайт

Лендинг и каталог вкусов для **Słodko Mi Smakuje Ci?** — кондитерской с синнабонами на Вильде в Познани
(ul. 28 Czerwca 1956 r. 177/13, вход с ul. Hetmańskiej). Статический сайт: каждая страница заранее собрана в HTML,
выкладывается по FTP на обычный хостинг Apache. Весь контент — в JSON и редактируется любым LLM.

## Стек

Vite 8 · React 19 · vite-react-ssg (предрендер каждой страницы) · Tailwind CSS 4 · TypeScript · Zod 4 (проверка контента
при сборке). Сервер не нужен — в `dist/` только статические файлы. Цель — Lighthouse ≥ 95 во всех категориях на мобильных.

## Быстрый старт

Нужен Node.js 20+ (лучше 22).

```bash
npm ci              # установить зависимости
npm run dev         # разработка: http://localhost:5173
npm run build       # проверка контента + сборка в dist/
npm run preview     # посмотреть собранный сайт
```

| Команда | Что делает |
| --- | --- |
| `npm run content:check` | проверить весь контент и актуальность `schema/` (запускается и перед сборкой) |
| `npm run content:schema` | пересобрать JSON-схемы в `schema/` после изменения `src/content/schema.ts` |
| `npm run images` | обработать фото из `assets/images/` |
| `npm run reviews:fetch` | обновить отзывы Google |
| `npm run ai -- "…"` | правка контента любым LLM |
| `npm run typecheck` | проверка типов |

## Контент

Все тексты, ссылки, фото, вкусы, часы работы, SEO и порядок блоков на страницах — в `src/data/`:

- `site.json` — название, контакты, адрес, часы, ссылки (Wolt, Instagram, Google), меню, футер, цвета, баннер cookies;
- `products.json` — вкусы и категории (карточки и страницы `/produkt/<slug>`);
- `pages/*.json` — страницы: каждый файл = отдельная страница со списком блоков `sections`;
- `reviews.json` — отзывы Google (обновляются автоматически).

Контракт — `src/content/schema.ts`, он же в виде JSON Schema в `schema/` (редакторы подсказывают поля через `$schema`).
Сломанный контент (несуществующее фото, ссылка, вкус) не пройдёт `npm run content:check` и не соберётся.

**Редактирование через нейросети** — 5 способов (агент в репозитории, MCP-сервер, `npm run ai`, GitHub Action с телефона,
ChatGPT): **[docs/LLM-EDITING.md](docs/LLM-EDITING.md)**. Правила для агентов — [AGENTS.md](AGENTS.md).

## Фото

Исходники — в `assets/images/<папка>/<имя>.(jpg|png|webp)`: `products/` (вкусы), `cutouts/` и `hero/` (вырезанные PNG с
прозрачностью), `photos/` (атмосфера), `og/` (картинка для соцсетей, 1200×630). Команда `npm run images` создаёт WebP
480/960/1600 px в `public/images/` и манифест `src/generated/images.json`; в JSON фото указывается ключом, например
`"src": "products/oreo"`. Коммитьте и исходник, и результат.

## Отзывы Google

`npm run reviews:fetch` берёт рейтинг, количество и свежие отзывы через Google Places API (New) и обновляет
`src/data/reviews.json`. Нужен `GOOGLE_PLACES_API_KEY` (в `.env.local`), `GOOGLE_PLACE_ID` — по желанию. В GitHub это
делает workflow **Refresh Google reviews** каждый понедельник (secret `GOOGLE_PLACES_API_KEY`, variable `GOOGLE_PLACE_ID`).

## Аналитика и пиксели

Всё необязательно: пустая переменная = выключено. Ничего не загружается до согласия в баннере cookies.

| Переменная | Что включает |
| --- | --- |
| `VITE_GA_ID` | Google Analytics 4 |
| `VITE_META_PIXEL_ID` | Meta (Facebook/Instagram) Pixel |
| `VITE_GTM_ID` | Google Tag Manager (другие пиксели без кода) |
| `VITE_TIKTOK_PIXEL_ID` | TikTok Pixel |

Локально — в `.env.local` (пример — `.env.example`), в GitHub — Variables/Secrets репозитория. События (клики «Zamów»,
звонок, маршрут, просмотры вкусов) описаны в [docs/TRACKING.md](docs/TRACKING.md).

## Деплой

Push в `main` → workflow **Deploy** (`.github/workflows/deploy.yml`):

- **FTP на хостинг** — secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (и при необходимости `FTP_SERVER_DIR`, по умолчанию
  `./public_html/`), variable `SITE_URL` — боевой адрес (canonical, sitemap). Без `FTP_SERVER` этот шаг пропускается.
  Настройки Apache и выкладка в подпапку — в `public/.htaccess`.
- **Превью на GitHub Pages** — https://sunlucki.github.io/SLODKO-MI/ (Settings → Pages → Source: GitHub Actions).

Pull request'ы проверяет workflow **CI** (контент, типы, сборка). Вручную: `npm run build` и загрузить содержимое `dist/`
в `public_html/`.

## React Bits

Анимированные блоки (`LogoLoop`, `CurvedLoop`, `BounceCards`, `Magnet`, `StickerPeel`, `ShinyText` в `src/components/`) взяты
из бесплатного реестра `@react-bits` через shadcn CLI, без лишних npm-зависимостей. В `components.json` также настроены платные
реестры `@reactbits-starter` и `@reactbits-pro`: для них нужен `REACTBITS_LICENSE_KEY` в `.env.local`, затем, например,
`npx shadcn@latest add @reactbits-starter/<компонент>`. Сейчас используются только бесплатные компоненты.

## Документация

- [docs/LLM-EDITING.md](docs/LLM-EDITING.md) — как править сайт нейросетями (для владельца)
- [AGENTS.md](AGENTS.md) — карта проекта и правила для AI-агентов
- [schema/README.md](schema/README.md) — все типы блоков и их поля
- [docs/TRACKING.md](docs/TRACKING.md) — аналитика и согласие на cookies
