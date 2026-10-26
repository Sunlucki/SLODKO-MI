# SŁODKO MI — сайт

Лендинг и каталог вкусов для **Słodko Mi Smakuje Ci?** — кондитерской с синнабонами (cynamonki) на Вильде в Познани
(ul. 28 Czerwca 1956 r. 177/13, вход с ul. Hetmańskiej; пн — выходной, вт–вс 10:00–19:00; доставка через Wolt).

- **Языки:** польский (`/`), английский (`/en/`), русский (`/ru/`), украинский (`/uk/`).
- **Статический сайт:** каждая страница заранее собрана в HTML, выкладывается по FTP на обычный хостинг Apache. Сервер
  и база данных не нужны.
- **Весь контент — в JSON** (`src/data/`): тексты, вкусы, фото, часы, меню, цвета, SEO, порядок блоков, переводы. Его
  может править любой AI-агент или чат-бот; проект сам проверяет каждую правку и не даёт сломать сайт.
- Цель по скорости и качеству — Lighthouse ≥ 95 во всех категориях на мобильных.

Не программист? Начните с **[docs/ru/ГАЙД.md](docs/ru/ГАЙД.md)** — короткая инструкция «как поменять что-то на сайте».

## Стек

Vite 8 · React 19 · vite-react-ssg (предрендер каждой страницы на каждом языке) · React Router 6 · Tailwind CSS 4 ·
TypeScript · Zod 4 (проверка контента при сборке). Node.js 20.19+ или 22.12+ (лучше 22).

## Быстрый старт

```bash
npm ci              # установить зависимости (один раз)
npm run dev         # разработка: http://localhost:5173  (английская версия — /en/)
npm run build       # проверка контента + сборка в dist/
npm run preview     # посмотреть собранный сайт: http://localhost:4173
```

| Команда | Что делает |
| --- | --- |
| `npm run content:check` | проверить весь контент и переводы (запускается и перед сборкой) |
| `npm run i18n:status` | сколько текстов переведено на каждый язык (`-- en --missing` — список непереведённого) |
| `npm run typecheck` | проверка типов TypeScript |
| `npm run images` | обработать фото из `assets/images/` (WebP разных размеров + картинки для соцсетей) |
| `npm run reviews:fetch` | обновить отзывы Google (нужен `GOOGLE_PLACES_API_KEY`) |
| `npm run ai -- "…"` | правка контента любым LLM одной фразой |
| `npm run content:schema` | пересобрать JSON-схемы в `schema/` после изменения `src/content/schema.ts` |
| `npm run docs:reference` | обновить таблицы полей в `docs/CONTENT-REFERENCE.md` после изменения схемы |

## Где что лежит

- `src/data/site.json` — название, контакты, адрес, часы и особые дни, ссылки (Wolt, Instagram, Google), меню, футер,
  цвета, SEO по умолчанию, баннер cookies, подписи интерфейса, языки;
- `src/data/products.json` — вкусы и категории (карточки и страницы `/produkt/<slug>/`);
- `src/data/pages/*.json` — страницы: каждый файл = отдельная страница со списком блоков `sections`;
- `src/data/i18n/en|ru|uk/` — переводы (только тексты, те же имена файлов);
- `src/data/reviews.json` — отзывы Google (обновляются автоматически, руками не править);
- `assets/images/` — исходные фото; `public/images/` и `src/generated/images.json` — результат `npm run images`.

Контракт контента — `src/content/schema.ts`; все поля с описанием — [docs/CONTENT-REFERENCE.md](docs/CONTENT-REFERENCE.md).
Сломанный контент (несуществующее фото, ссылка, вкус, лишнее поле) не пройдёт `npm run content:check` и не соберётся.

## Как править сайт через AI-агента

Пять способов — от Claude Code/Cursor в папке проекта до GitHub Action с телефона и обычного ChatGPT:
**[docs/LLM-EDITING.md](docs/LLM-EDITING.md)**. Агенты сами читают [AGENTS.md](AGENTS.md) (карта проекта, правила,
команды); Claude Code — через `CLAUDE.md`. Для типовых задач у агента есть пошаговые рецепты:
[docs/RECIPES.md](docs/RECIPES.md).

Пишите задачу обычным языком, по-русски или по-польски: «поменяй часы в субботу на 10–17», «добавь вкус … с фото …»,
«переведи новые тексты на украинский». Агент правит JSON, проверяет и (по желанию) собирает сайт. Факты (цены, состав,
аллергены, часы) агент берёт только от вас — ничего не выдумывает.

## Языки

Польские файлы — главные: в них структура, ссылки, фото, цены, часы. Переводы в `src/data/i18n/<язык>/` содержат только
тексты; чего нет в переводе — показывается по-польски. Первый визит на польскую страницу из браузера на другом языке
автоматически ведёт на `/en/`, `/ru/` или `/uk/` (поисковых роботов — никогда); выбор в переключателе языка
запоминается. Подробно, включая добавление нового языка: [docs/I18N.md](docs/I18N.md).

## Аналитика и пиксели

Всё необязательно: пустая переменная = выключено. Ничего не загружается до согласия в баннере cookies.

| Переменная | Что включает |
| --- | --- |
| `VITE_GA_ID` | Google Analytics 4 |
| `VITE_META_PIXEL_ID` | Meta (Facebook/Instagram) Pixel |
| `VITE_GTM_ID` | Google Tag Manager (другие пиксели без кода) |
| `VITE_TIKTOK_PIXEL_ID` | TikTok Pixel |

Локально — в `.env.local` (пример — `.env.example`), для сайта — в Variables/Secrets репозитория на GitHub. Каждый
включённый сервис должен быть назван в тексте баннера и в политике конфиденциальности — иначе сборка остановится.
События и согласие: [docs/TRACKING.md](docs/TRACKING.md).

## Деплой

Push в `main` → workflow **Deploy** (`.github/workflows/deploy.yml`):

- **FTP на хостинг** — secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (и при необходимости `FTP_SERVER_DIR`,
  по умолчанию `./public_html/`), variable `SITE_URL` — боевой адрес, например `https://example.pl` (canonical, sitemap,
  og:url). Без `SITE_URL` шаг падает с ошибкой, без `FTP_SERVER` — пропускается.
- **Превью на GitHub Pages** — https://sunlucki.github.io/SLODKO-MI/ (Settings → Pages → Source: GitHub Actions).
  Превью закрыто от индексации (`noindex`, без sitemap).

Pull request'ы проверяет workflow **CI** (контент, типы, сборка; неполные переводы — только предупреждение). Вручную:
`SITE_URL=https://example.pl npm run build` и загрузить **содержимое** `dist/` (вместе со скрытым `.htaccess`) в
`public_html/`. Подробно (подпапка рядом с WordPress, `.htaccess`, все переменные): [docs/DEPLOY.md](docs/DEPLOY.md).

## React Bits

Анимированные блоки (`LogoLoop`, `CurvedLoop`, `BounceCards`, `Magnet`, `StickerPeel`, `ShinyText` в `src/components/`)
взяты из бесплатного реестра `@react-bits` через shadcn CLI. В `components.json` настроены и платные реестры
`@reactbits-starter` / `@reactbits-pro`: нужен `REACTBITS_LICENSE_KEY` (в `.env.local` или в команде), затем
`npx shadcn@latest add @reactbits-starter/<компонент>`. Тяжёлые зависимости (motion, gsap, three) не добавлять —
см. [docs/RECIPES.md](docs/RECIPES.md#use-react-bits-pro-components-reactbits-starter).

## Список дел для владельца

Без этих данных сайт работает, но они нужны, чтобы он был полным и юридически чистым. Агент их не придумывает.

1. **Юридические данные для политики конфиденциальности** — полное название фирмы (как в CEIDG/KRS), NIP (и REGON),
   e-mail для вопросов о данных. Сейчас сборка предупреждает: „the privacy policy names no NIP”.
   Файл: `src/data/pages/polityka-prywatnosci.json` (+ переводы).
2. **Аллергены и состав каждого вкуса** — сейчас списки пустые (у Oreo есть только состав). Нужны: аллергены из списка ЕС,
   по желанию вес, калорийность. Файл: `src/data/products.json`.
3. **Цены** — известна только Oreo (24 zł, из Wolt). Когда будут все — включить показ (`catalog.showPrices`).
4. **Настоящие фото вместо AI-иллюстраций** — главный экран (`hero/cynamonka`) и вкус «Malina z kokosem»
   (`cutouts/malina-z-kokosem`, `products/malina-z-kokosem`). Рецепт: [docs/RECIPES.md](docs/RECIPES.md#replace-ai-images-with-real-photos).
5. **Подтвердить особые часы** в `site.json → specialHours` (29.10 — с 10:30, 31.10 — закрыто, 01.11 — 10:00–19:00) и
   прислать праздничные часы (11.11, Рождество, Новый год).
6. **Домен и `SITE_URL`** — купить/выбрать домен, направить его на хостинг, включить HTTPS, вписать `SITE_URL` в
   Variables на GitHub и в `site.json → url`. Рецепт: [docs/RECIPES.md](docs/RECIPES.md#set-the-production-domain-site_url).
7. **Доступ к FTP** хостинга — для secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
8. **ID пикселей** — Google Analytics 4, Meta Pixel (и при желании TikTok, GTM) → Variables на GitHub.
9. **Ключ Google Places API** (`GOOGLE_PLACES_API_KEY`, secret на GitHub) — для еженедельного обновления отзывов.
10. **Ключ LLM** (`LLM_API_KEY`) — если хотите править сайт с телефона через GitHub Action.
11. **Google Business Profile и каталоги** — пошаговый список (категории, фото, особые часы, ответы на отзывы,
    Wolt, TripAdvisor, visitpoznan.pl…): [docs/SEO.md](docs/SEO.md#local-seo-checklist-for-the-owner).
12. **Подтвердить факты для FAQ** иностранцев: оплата картой/BLIK, можно ли с собакой, доступность для колясок, Wi-Fi —
    только после подтверждения их можно писать на сайте.

## Документация

| Документ | Для кого / о чём |
| --- | --- |
| [docs/ru/ГАЙД.md](docs/ru/ГАЙД.md) | владелец: как поменять что-то на сайте, без программирования |
| [docs/LLM-EDITING.md](docs/LLM-EDITING.md) | владелец: все способы правки нейросетями, настройка MCP / `npm run ai` / GitHub Action |
| [AGENTS.md](AGENTS.md) | AI-агенты и разработчики: карта проекта, правила, команды |
| [docs/RECIPES.md](docs/RECIPES.md) | пошаговые рецепты для типовых задач |
| [docs/CONTENT-REFERENCE.md](docs/CONTENT-REFERENCE.md) | каждое поле каждого файла, примеры всех блоков |
| [docs/I18N.md](docs/I18N.md) | переводы, автоопределение языка, новый язык |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | как устроен код и сборка |
| [docs/DEPLOY.md](docs/DEPLOY.md) | FTP, `.htaccess`, GitHub Pages, переменные и секреты |
| [docs/SEO.md](docs/SEO.md) | техническое SEO и чек-лист локального SEO для владельца |
| [docs/SEO-KEYWORDS.md](docs/SEO-KEYWORDS.md) | карта ключевых слов PL/EN/RU/UK |
| [docs/TRACKING.md](docs/TRACKING.md) | аналитика, пиксели, согласие на cookies |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | ошибки проверки и сборки — что значат и как исправить |
