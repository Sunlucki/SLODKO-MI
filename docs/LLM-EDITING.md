# Редактирование сайта с помощью любого LLM

Весь сайт SŁODKO MI — тексты, ссылки, фото, вкусы, часы работы, SEO и **порядок блоков на страницах** — хранится
в JSON-файлах в `src/data/`. Код трогать не нужно: нейросеть меняет JSON, проект сам проверяет правку
(схемы, существование фото, ссылок и вкусов) и не даёт сохранить сломанный контент.

Пишите инструкции **по-русски или по-польски** — тексты на сайте модель всегда пишет по-польски.

| Способ | Когда удобно | Что нужно |
| --- | --- | --- |
| [1. Агент в репозитории](#1-агент-в-репозитории) — Claude Code, Cursor, Codex, Copilot | большие правки, новые блоки, код | редактор/терминал |
| [2. MCP-сервер](#2-mcp-сервер) — Claude Desktop, Cursor, VS Code, Windsurf | правки в чате с безопасными инструментами | Node.js + проект на компьютере |
| [3. Команда `npm run ai`](#3-команда-npm-run-ai) — Anthropic, OpenAI, OpenRouter, Ollama… | быстрые правки одной фразой | терминал + API-ключ |
| [4. GitHub Action](#4-github-action-с-телефона) | с телефона, без компьютера | аккаунт GitHub |
| [5. ChatGPT / любой чат](#5-chatgpt-или-любой-чат) | нет API-ключа, есть подписка на чат | браузер |

## Что где лежит

| Что | Файл |
| --- | --- |
| Название, телефон, адрес, вход с Hetmańskiej, часы, ссылки (Wolt, Instagram, Google), меню, футер, цвета, баннер cookies | `src/data/site.json` |
| Вкусы: названия, описания, цены, аллергены, фото, «Bestseller» | `src/data/products.json` |
| Страницы: каждая — файл `src/data/pages/<slug>.json` (главная — `home.json`) со списком блоков `sections` | `src/data/pages/` |
| Отзывы Google (обновляются автоматически раз в неделю — руками не править) | `src/data/reviews.json` |
| Описание всех полей и типов блоков | `schema/README.md`, `schema/*.schema.json` |
| Правила для нейросетей | `AGENTS.md` |

**Типы блоков** (`type`): `hero` (первый экран), `about`, `split`, `productGrid` (сетка вкусов), `reviews`, `visit` (адрес,
часы, карта), `gallery`, `faq`, `cta` (баннер с кнопками), `text`. Блок скрывается полем `"enabled": false`, порядок
блоков = порядок в массиве. Новый файл в `src/data/pages/` = новая страница сайта.

**Ссылки-токены** вместо адресов: `@order` (Wolt), `@phone`, `@directions` (маршрут), `@instagram`, `@facebook`, `@reviews`,
`@writeReview`. Они берут адреса из `site.json`, и клики по ним автоматически считаются в аналитике.

**Фото** указываются ключом (`products/oreo`, `photos/zespol`). Новое фото: положить файл в `assets/images/<папка>/<имя>.jpg`
и выполнить `npm run images` (или инструмент `add_image` в MCP).

### Примеры инструкций

- «Поменяй часы работы: в субботу и воскресенье с 10 до 17»
- «Добавь новый вкус „Pistacja z białą czekoladą“ с фото cutouts/pistacja, аллергены: глютен, молоко, яйца, орехи»
  (фото сначала положите в `assets/images/cutouts/pistacja.png` и выполните `npm run images`)
- «Сделай „Malina z kokosem“ бестселлером и поставь её первой в сетке вкусов»
- «Перенеси блок с отзывами сразу после первого экрана и скрой галерею»
- «Добавь в FAQ вопрос, можно ли прийти с собакой — ответ: да, конечно»
- «Создай страницу „Zamówienia na eventy“ по адресу /eventy с текстом и кнопкой звонка, добавь её в меню»
- «Napisz nowe hasło w hero — bardziej zabawne, w stylu poznańskim»

---

## 1. Агент в репозитории

Claude Code, Cursor, OpenAI Codex, GitHub Copilot (agent mode), Gemini CLI, Aider и другие агенты читают **`AGENTS.md`**
(Claude Code — через `CLAUDE.md`, который его импортирует). Там описано, где лежит каждый кусок контента, правила
правок, команды и как добавить новый тип блока в код.

1. Откройте папку проекта в агенте.
2. Напишите задачу обычным языком — например, «поставь вкус „Malina z kokosem“ первым в сетке и добавь ему значок Nowość».
3. Агент правит JSON и запускает `npm run content:check`. Посмотреть результат: `npm run dev` → http://localhost:5173.
4. Сделайте commit и push в `main` — сайт опубликуется автоматически (FTP + превью на GitHub Pages).

В Claude Code MCP-сервер из способа 2 подключается сам (файл `.mcp.json`) — при первом запуске согласитесь его включить.

## 2. MCP-сервер

`scripts/content-mcp.ts` — MCP-сервер `slodkomi-content`. Он даёт нейросети безопасные инструменты:

| Инструмент | Что делает |
| --- | --- |
| `list_content` | карта контента: страницы и их блоки, вкусы, меню, фото, ошибки |
| `get_schema` | JSON-схемы и описание всех типов блоков |
| `read_content` / `write_content` | прочитать / заменить файл целиком (или создать новую страницу) |
| `patch_content` | точечная правка (JSON Patch) — лучший вариант для мелочей |
| `delete_page` | удалить страницу (кроме главной) |
| `validate_content` | проверить весь контент |
| `list_images` / `add_image` | список фото / добавить фото с компьютера (WebP-версии создаются сами) |
| `build_site` | собрать сайт и показать результат |

Писать можно **только** в `src/data/site.json`, `products.json`, `reviews.json` и `src/data/pages/*.json`. Каждая запись
проверяется теми же правилами, что и сборка; если правка что-то ломает — файл **автоматически откатывается**, а модель
получает список ошибок и исправляет себя.

Перед подключением один раз выполните в папке проекта `npm ci`. Ниже `/ПУТЬ/К/SłodkoMi` — полный путь к проекту
(узнать: `pwd` в папке проекта).

**Claude Code** — уже настроено в `.mcp.json`. Вручную: `claude mcp add slodkomi-content -- npx tsx scripts/content-mcp.ts`.

**Claude Desktop** — Settings → Developer → Edit Config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "slodkomi-content": {
      "command": "npx",
      "args": ["-y", "tsx", "/ПУТЬ/К/SłodkoMi/scripts/content-mcp.ts"]
    }
  }
}
```

Если Claude Desktop пишет `spawn npx ENOENT` (так бывает с nvm/Homebrew), укажите node полным путём (`which node`):

```json
{
  "mcpServers": {
    "slodkomi-content": {
      "command": "/opt/homebrew/bin/node",
      "args": ["/ПУТЬ/К/SłodkoMi/node_modules/tsx/dist/cli.mjs", "/ПУТЬ/К/SłodkoMi/scripts/content-mcp.ts"]
    }
  }
}
```

**Cursor** — `.cursor/mcp.json` в проекте или `~/.cursor/mcp.json` (формат как у Claude Desktop, путь — абсолютный).

**VS Code** (Copilot, agent mode) — `.vscode/mcp.json`:

```json
{
  "servers": {
    "slodkomi-content": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "${workspaceFolder}/scripts/content-mcp.ts"]
    }
  }
}
```

**Windsurf** — `~/.codeium/windsurf/mcp_config.json` (формат как у Claude Desktop). **Любой другой MCP-клиент** — stdio-команда
`npx tsx /ПУТЬ/К/SłodkoMi/scripts/content-mcp.ts`.

Начните разговор с «Посмотри контент сайта (list_content) и …». После правок попросите `build_site`, затем закоммитьте и
отправьте изменения в GitHub (терминал или GitHub Desktop) — сайт опубликуется сам.

## 3. Команда `npm run ai`

Одна фраза — и правка готова. Работает с любым LLM: напрямую с Anthropic API или с любым OpenAI-совместимым API.

```bash
npm run ai -- "Добавь в FAQ вопрос про парковку" --dry-run   # показать изменения, ничего не сохраняя
npm run ai -- "Добавь в FAQ вопрос про парковку"             # применить (спросит подтверждение)
npm run ai -- "Скрой галерею" --yes --build                  # без вопросов + сразу собрать сайт
```

Как это работает: модель получает правила из `AGENTS.md`, JSON-схемы, список фото и вкусов и все текущие файлы,
и отвечает набором JSON Patch-операций. Скрипт применяет их, проверяет весь контент и при ошибке **откатывает файлы**
и отправляет ошибки модели — до 3 раундов исправлений. В конце печатается понятный список изменений по файлам.
Предыдущие версии файлов сохраняются в `.ai-edit-backup/<дата>/`.

Настройки — в `.env.local` (не попадает в git) или в переменных окружения:

```bash
# Anthropic (по умолчанию). Модель по умолчанию — claude-opus-5-5
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-...
# LLM_MODEL=claude-sonnet-5-5   # дешевле;  claude-fable-5-1 — самая сильная и самая дорогая

# OpenAI
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-5

# OpenRouter (сотни моделей по одному ключу)
LLM_PROVIDER=openai
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-...
LLM_MODEL=openai/gpt-5

# Google Gemini (OpenAI-совместимый режим)
LLM_PROVIDER=openai
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_API_KEY=...
LLM_MODEL=gemini-2.5-pro

# Ollama — локально и бесплатно (ключ не нужен)
LLM_PROVIDER=openai
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen3:32b

# LM Studio — локально
LLM_PROVIDER=openai
LLM_BASE_URL=http://localhost:1234/v1
LLM_MODEL=<имя загруженной модели>
```

Так же подключаются Groq (`https://api.groq.com/openai/v1`), Mistral (`https://api.mistral.ai/v1`), DeepSeek и любые другие
OpenAI-совместимые сервисы. Названия моделей меняются — актуальные смотрите в списке моделей провайдера.

Полезно знать:

- Запрос — примерно 15–20 тыс. токенов (весь контент + схемы). На Claude Opus 5.5 правка обычно стоит порядка 0,1–0,3 $;
  повторные раунды дешевле — большая часть запроса кешируется.
- Локальным моделям нужен контекст не меньше 32 тыс. токенов: для Ollama запускайте `OLLAMA_CONTEXT_LENGTH=32768 ollama serve`,
  в LM Studio увеличьте Context Length в настройках модели. Маленькие модели (7–8B) часто ошибаются — берите 30B+.
- Если модель не может выполнить просьбу одним контентом (нужен новый тип блока, нет нужного фото), она ничего не меняет и
  объясняет, чего не хватает.
- Откатить сохранённую правку: скопируйте файлы из `.ai-edit-backup/<дата>/src/data/` обратно в `src/data/`
  (или `git checkout -- src/data`, если правка ещё не закоммичена).

## 4. GitHub Action с телефона

Правка без компьютера: в приложении GitHub или на github.com.

**Один раз настроить** (Settings репозитория):

1. Secrets and variables → Actions → **New repository secret**: `LLM_API_KEY` — ключ Anthropic (или другого провайдера).
2. Там же, вкладка **Variables** (необязательно): `LLM_PROVIDER` (`anthropic` или `openai`), `LLM_MODEL`, `LLM_BASE_URL` —
   значения как в способе 3.
3. Actions → General → Workflow permissions → включить **Allow GitHub Actions to create and approve pull requests**.

**Каждая правка:**

1. Вкладка **Actions** → слева **AI edit** → **Run workflow**.
2. Впишите, что изменить (по-русски или по-польски); при желании — провайдера и модель. **Run workflow**.
3. Через 2–5 минут появится **Pull request** «AI: …» — в описании итог от модели и список изменений, во вкладке
   *Files changed* — точный diff. Контент уже проверен, сайт уже собран.
4. Всё хорошо → **Merge pull request**. Workflow **Deploy** сам опубликует сайт (FTP + превью на GitHub Pages).
   Не нравится → **Close pull request**, сайт не изменится.

Если модель не смогла выполнить просьбу, PR не создаётся: её объяснение — в Summary запуска, ошибки проверки — в логе шага
*Edit content with the LLM*.

## 5. ChatGPT или любой чат

**Вариант А — через подготовленный промпт (надёжно).** Нужен проект на компьютере, но не нужен API-ключ:

```bash
npm run ai -- --prompt "Добавь в FAQ вопрос про парковку" | pbcopy   # промпт в буфер обмена (macOS)
```

1. Вставьте промпт в ChatGPT, Gemini, Claude.ai, DeepSeek — куда угодно.
2. Ответ модели (JSON) сохраните в файл, например `answer.json`.
3. Примените: `npm run ai -- --response answer.json` — скрипт проверит правку, покажет изменения и спросит подтверждение.
   Если есть ошибки — ничего не сохранится; вставьте ошибки в тот же чат и попросите исправить.

**Вариант Б — совсем без терминала, через сайт GitHub:**

1. Откройте на github.com нужный файл, например `src/data/site.json`, и `schema/site.schema.json`
   (для страниц — `src/data/pages/home.json` и `schema/page.schema.json`; список типов блоков — `schema/README.md`).
2. Скопируйте оба в чат и напишите: «Вот JSON-схема и файл. Измени … Верни файл целиком, без пояснений».
3. В GitHub нажмите ✏️ у файла, замените содержимое ответом модели → **Commit changes** → *Create a new branch and start a
   pull request*.
4. Проверка CI в pull request покажет, всё ли правильно (если красная — откройте лог, скопируйте ошибку в чат). Затем **Merge**.

## Если что-то пошло не так

- **Ошибка проверки контента** — текст ошибки говорит, что не так: `image "…" not found` (нет такого фото),
  `link "/#…" → no section with id` (ссылка на несуществующий блок), `product "…" does not exist` (опечатка в slug).
  MCP и `npm run ai` сами откатывают такие правки.
- **Сайт уже опубликован с ошибкой** — в GitHub откройте смерженный pull request → **Revert** → смержите возврат.
- **Проверить всё вручную:** `npm run content:check`, затем `npm run build`.
