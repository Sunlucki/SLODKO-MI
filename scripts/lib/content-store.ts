/**
 * Shared core of the LLM editing tools (scripts/content-mcp.ts, scripts/ai-edit.ts, scripts/export-schema.ts,
 * scripts/i18n-status.ts): a strict whitelist of editable files (Polish content + translation overlays), a JSON
 * formatter matching the style of src/data, transactional writes validated with loadContent() (automatic rollback),
 * translation completeness, JSON Schema export and a content overview.
 * Node-only. Paths resolve from the repo root, so the tools work from any working directory.
 */
import { spawn } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jsonpatch, { type Operation } from 'fast-json-patch'
import { z } from 'zod'
import { missingTranslations, NOT_TRANSLATABLE, type MissingText } from '../../src/content/i18n.ts'
import * as S from '../../src/content/schema.ts'
import { CONTENT_FILES, loadContent, translationStatus, type ImageManifest } from '../../src/content/validate.ts'

export type { Operation }

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// ── Editable files ─────────────────────────────────────────────────────────────

const CONTENT = /^src\/data\/(?:(?:site|products|reviews)\.json|pages\/[a-z0-9-]+\.json)$/
/** Translation overlay: src/data/i18n/<locale>/site.json, products.json or pages/<slug>.json (reviews are never translated) */
const TRANSLATION = /^src\/data\/i18n\/([a-z]{2})\/((?:site|products)\.json|pages\/[a-z0-9-]+\.json)$/
/** Readable but never written by the LLM tools: only scripts/fetch-google-reviews.ts updates it. */
export const READ_ONLY = new Set<string>([CONTENT_FILES.reviews])
export const PROTECTED_PAGE = 'src/data/pages/home.json'

/** Locale and Polish counterpart of a translation file ("src/data/i18n/en/pages/home.json" → en, src/data/pages/home.json), or null. */
export function translationOf(rel: string): { locale: string; base: string } | null {
  const m = rel.match(TRANSLATION)
  return m ? { locale: m[1], base: `src/data/${m[2]}` } : null
}

/** Languages and their translation codes from site.json → i18n (works while other files are invalid). */
export function languages(): { defaultLocale: string; locales: { code: string; label: string; short?: string }[]; translations: string[] } {
  let i18n: { defaultLocale?: string; locales?: { code: string; label: string; short?: string }[] } | undefined
  try {
    i18n = (readJsonFile(CONTENT_FILES.site) as { i18n?: typeof i18n }).i18n
  } catch {
    /* site.json missing or broken: no translations can be edited */
  }
  const defaultLocale = i18n?.defaultLocale ?? 'pl'
  const locales = (i18n?.locales ?? []).map(({ code, label, short }) => ({ code, label, short }))
  return { defaultLocale, locales, translations: locales.map((l) => l.code).filter((c) => c !== defaultLocale) }
}

/** $schema value written into each kind of file (relative to the file, for editor autocompletion). */
function schemaRef(rel: string): string {
  if (rel.startsWith('src/data/pages/')) return '../../../schema/page.schema.json'
  const name = { 'src/data/site.json': 'site', 'src/data/products.json': 'catalog', 'src/data/reviews.json': 'reviews' }[rel]
  return `../../schema/${name}.schema.json`
}

/**
 * Normalises a content path ("src/data/site.json", "site.json", "pages/o-nas.json", "i18n/en/site.json" or an absolute
 * path inside the repo) and rejects anything outside the whitelist — no traversal, no symlinks (also dangling ones
 * and symlinked folders). mode "write" also rejects the read-only reviews.json. Translation files may not exist yet,
 * and neither may their folders (commit() creates them).
 */
export function contentPath(file: string, mode: 'read' | 'write' = 'read'): { rel: string; abs: string } {
  let rel = file.trim().replace(/\\/g, '/')
  if (path.isAbsolute(rel)) rel = path.relative(ROOT, rel).replace(/\\/g, '/')
  rel = path.posix.normalize(rel).replace(/^\.\//, '')
  if (!rel.startsWith('src/')) rel = `src/data/${rel}`
  const translation = translationOf(rel)
  const { defaultLocale, translations } = languages()
  if (!CONTENT.test(rel) && !translation)
    throw new Error(
      `"${file}" is not a content file. Allowed: src/data/site.json, src/data/products.json, ` +
        'src/data/pages/<slug>.json (slug: a-z, 0-9, "-") and their translations ' +
        `src/data/i18n/<${translations.join('|') || 'locale'}>/(site.json|products.json|pages/<slug>.json); src/data/reviews.json is read-only.`,
    )
  if (translation && !translations.includes(translation.locale))
    throw new Error(
      `"${translation.locale}" is not a translation language — site.json → i18n.locales has ${translations.join(', ') || 'none'} ` +
        `besides the default "${defaultLocale}" (add a new language there first)`,
    )
  if (mode === 'write' && READ_ONLY.has(rel))
    throw new Error(`${rel} is read-only: reviews are refreshed from Google by \`npm run reviews:fetch\` — never write, edit or invent reviews`)
  const abs = path.join(ROOT, rel)
  if (lstatSync(abs, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error(`"${rel}" is a symlink — refusing to touch it`)
  // The nearest existing folder must be the real one (a missing translation folder is created on write)
  let dir = path.dirname(abs)
  if (translation) while (!lstatSync(dir, { throwIfNoEntry: false })) dir = path.dirname(dir)
  let real: string | undefined
  try {
    real = realpathSync(dir)
  } catch {
    /* dangling symlink */
  }
  if (real !== path.join(realpathSync(ROOT), path.relative(ROOT, dir)))
    throw new Error(`"${path.dirname(rel)}" is not a plain folder inside the project — refusing to touch it`)
  return { rel, abs }
}

/** Existing translation files of the configured languages (src/data/i18n/<locale>/…), sorted. */
export function listTranslationFiles(locales = languages().translations): string[] {
  return locales.flatMap((code) => {
    const dir = `${CONTENT_FILES.i18nDir}/${code}`
    const has = (f: string) => existsSync(path.join(ROOT, dir, f))
    const pages = has('pages') ? readdirSync(path.join(ROOT, dir, 'pages')).sort().map((f) => `pages/${f}`) : []
    return ['site.json', 'products.json', ...pages].filter(has).map((f) => `${dir}/${f}`).filter((rel) => TRANSLATION.test(rel))
  })
}

/** All files the LLM tools may edit that exist now (pages sorted by name, then translations); reviews.json is not one of them. */
export function listContentFiles(): string[] {
  const pages = readdirSync(path.join(ROOT, CONTENT_FILES.pagesDir))
    .filter((f) => /^[a-z0-9-]+\.json$/.test(f))
    .sort()
    .map((f) => `${CONTENT_FILES.pagesDir}/${f}`)
  return [CONTENT_FILES.site, CONTENT_FILES.catalog, ...pages, ...listTranslationFiles()]
}

/** Translation files of a page that exist (deleted together with the page — they would point at nothing). */
export function pageTranslations(pageRel: string): string[] {
  return listTranslationFiles().filter((rel) => translationOf(rel)?.base === pageRel)
}

export function readText(rel: string): string | null {
  const abs = path.join(ROOT, rel)
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null
}

export function readJsonFile(rel: string): unknown {
  const text = readText(rel)
  if (text === null) throw new Error(`${rel} does not exist`)
  return JSON.parse(text)
}

// ── Formatting ─────────────────────────────────────────────────────────────────

const WIDTH = 160
const isFlat = (v: unknown) => v === null || typeof v !== 'object' || (Array.isArray(v) && v.every((x) => x === null || typeof x !== 'object'))

/** Small objects/arrays stay on one line (like the hand-written data files); everything else is expanded. */
function fitsInline(v: unknown): boolean {
  if (Array.isArray(v)) return v.every((x) => x === null || typeof x !== 'object') || (v.length === 1 && !Array.isArray(v[0]) && fitsInline(v[0]))
  if (v && typeof v === 'object') return Object.keys(v).length <= 4 && Object.values(v).every(isFlat)
  return true
}

function inline(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`
  if (v && typeof v === 'object') {
    const entries = Object.entries(v)
    return entries.length ? `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(', ')} }` : '{}'
  }
  return JSON.stringify(v)
}

function format(v: unknown, indent: string, prefix: number): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  const one = inline(v)
  if (fitsInline(v) && indent.length + prefix + one.length + 1 <= WIDTH) return one
  const inner = indent + '  '
  const items = Array.isArray(v)
    ? v.map((x) => inner + format(x, inner, 0))
    : Object.entries(v).map(([k, x]) => `${inner}${JSON.stringify(k)}: ${format(x, inner, JSON.stringify(k).length + 2)}`)
  if (!items.length) return Array.isArray(v) ? '[]' : '{}'
  return Array.isArray(v) ? `[\n${items.join(',\n')}\n${indent}]` : `{\n${items.join(',\n')}\n${indent}}`
}

/**
 * Serialises a content document: "$schema" first (editor autocompletion), house formatting, trailing newline.
 * Translation files have no schema of their own (they hold only texts): a "$schema" they already have is kept as is.
 */
export function serialize(rel: string, doc: unknown): string {
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    const { $schema, ...rest } = doc as Record<string, unknown>
    const ref = translationOf(rel) ? $schema : schemaRef(rel)
    doc = ref === undefined ? rest : { $schema: ref, ...rest }
  }
  return format(doc, '', 0) + '\n'
}

// ── Patching ───────────────────────────────────────────────────────────────────

/** Applies RFC 6902 operations to a copy of `doc`; throws a short, model-readable error. */
export function applyOperations(doc: unknown, ops: Operation[]): unknown {
  try {
    return jsonpatch.applyPatch(doc, ops, true, false).newDocument
  } catch (e) {
    const err = e as { name?: string; message?: string; index?: number }
    const op = err.index !== undefined ? ops[err.index] : undefined
    const where = op ? ` (operation #${err.index}: ${op.op} "${op.path}")` : ''
    throw new Error(`${err.name ?? 'Error'}: ${(err.message ?? String(e)).split('\n')[0]}${where}`)
  }
}

/** Human-readable list of differences between two versions of a document. */
export function describeChanges(before: unknown, after: unknown, max = 40): string[] {
  const short = (v: unknown) => {
    const s = JSON.stringify(v) ?? 'undefined'
    return s.length > 90 ? `${s.slice(0, 87)}…` : s
  }
  const lines = jsonpatch.compare(before as object, after as object).map((op) => {
    const old = op.op === 'add' ? undefined : jsonpatch.getValueByPointer(before, op.path)
    if (op.op === 'replace') return `~ ${op.path}: ${short(old)} → ${short(op.value)}`
    if (op.op === 'add') return `+ ${op.path}: ${short(op.value)}`
    return `- ${op.path}: ${short(old)}`
  })
  return lines.length > max ? [...lines.slice(0, max), `… and ${lines.length - max} more`] : lines
}

// ── Transactional writes ───────────────────────────────────────────────────────

export interface Change {
  rel: string
  /** New file text, or null to delete the file */
  text: string | null
}

export interface CommitResult {
  ok: boolean
  /** ok=false: errors introduced by the change (already rolled back). ok=true: problems that existed before. */
  errors: string[]
  originals: Map<string, string | null>
}

/** Error messages of loadContent() about translation files (their path is repo-relative or absolute). */
const isTranslationError = (e: string) => e.startsWith(`${CONTENT_FILES.i18nDir}/`) || e.startsWith(path.join(ROOT, CONTENT_FILES.i18nDir) + path.sep)

/**
 * Writes all changes, validates the whole content with loadContent() and restores the original files
 * when the change introduces any new error. Pre-existing errors do not block a change, except an invalid
 * file the change does not touch: references into it cannot be checked, so it has to be fixed first.
 * Translations are checked only against valid default-language content, so a change to a translation file
 * is refused while the default-language content has errors.
 */
export function commit(changes: Change[]): CommitResult {
  for (const c of changes) contentPath(c.rel, 'write')
  const pre = loadContent(ROOT)
  const blocking = pre.invalid.filter((f) => !READ_ONLY.has(f) && !changes.some((c) => c.rel === f))
  if (blocking.length)
    return {
      ok: false,
      errors: blocking.map((f) =>
        f === CONTENT_FILES.images
          ? `${f} is broken — run \`npm run images\` before editing content`
          : `${f} does not pass validation (see validate_content / npm run content:check) — fix that file first or in the same change; until then links and references into it cannot be checked`,
      ),
      originals: new Map(),
    }
  const before = new Set(pre.errors)
  const originals = new Map(changes.map((c) => [c.rel, readText(c.rel)]))
  try {
    for (const c of changes) writeContent(c.rel, c.text)
    const errors = loadContent(ROOT).errors
    const introduced = errors.filter((e) => !before.has(e))
    const unchecked = changes.some((c) => translationOf(c.rel)) ? errors.filter((e) => !isTranslationError(e)) : []
    if (introduced.length || unchecked.length) {
      restore(originals)
      const reason = introduced.length
        ? introduced
        : [`Translations are checked only against valid default-language content — fix these problems first:`, ...unchecked]
      return { ok: false, errors: reason, originals }
    }
    return { ok: true, errors, originals }
  } catch (e) {
    restore(originals)
    throw e
  }
}

/** Writes (creating translation folders) or deletes (removing translation folders left empty) one content file. */
function writeContent(rel: string, text: string | null) {
  const abs = contentPath(rel, 'write').abs
  if (text !== null) {
    mkdirSync(path.dirname(abs), { recursive: true })
    writeFileSync(abs, text)
    return
  }
  rmSync(abs, { force: true })
  if (!translationOf(rel)) return
  const stop = path.join(ROOT, 'src/data')
  for (let dir = path.dirname(abs); dir !== stop && existsSync(dir) && !readdirSync(dir).length; dir = path.dirname(dir)) rmdirSync(dir)
}

export function restore(originals: Map<string, string | null>) {
  for (const [rel, text] of originals) writeContent(rel, text)
}

// ── Overview ───────────────────────────────────────────────────────────────────

export function imageManifest(): ImageManifest {
  const text = readText(CONTENT_FILES.images)
  return text ? (JSON.parse(text) as ImageManifest) : {}
}

type Loose = Record<string, any>

/** Compact map of the content (works even when some file is invalid). */
export function overview() {
  const safe = (rel: string): Loose | undefined => {
    try {
      return readJsonFile(rel) as Loose
    } catch {
      return undefined
    }
  }
  const catalog = safe(CONTENT_FILES.catalog)
  const site = safe(CONTENT_FILES.site)
  const { errors } = loadContent(ROOT)
  const langs = languages()
  const report = translations()
  return {
    valid: errors.length === 0,
    errors,
    files: listContentFiles(),
    readOnly: [...READ_ONLY],
    languages: {
      default: langs.defaultLocale,
      note:
        `Files in src/data are ${langs.defaultLocale}. Other languages are text-only overlays in src/data/i18n/<locale>/ ` +
        '(missing texts show in the default language) — see translation_status and get_schema.',
      translations: langs.locales
        .filter((l) => l.code !== langs.defaultLocale)
        .map(({ code, label }) => {
          const files = report?.files.filter((f) => f.locale === code)
          if (!files) return { code, label, completeness: 'unknown while the content is invalid' }
          const sum = (k: 'total' | 'translated') => files.reduce((n, f) => n + f[k], 0)
          return {
            code,
            label,
            completeness: percent(sum('translated'), sum('total')),
            files: files.map((f) => ({ file: f.file, exists: f.exists, translated: `${f.translated}/${f.total}` })),
          }
        }),
    },
    pages: listContentFiles()
      .filter((f) => f.startsWith(`${CONTENT_FILES.pagesDir}/`))
      .map((file) => {
        const page = safe(file)
        return {
          file,
          path: page?.path,
          title: page?.seo?.title,
          sections: (page?.sections ?? []).map((s: Loose, index: number) => ({ index, id: s.id, type: s.type, enabled: s.enabled !== false })),
        }
      }),
    nav: site?.nav,
    categories: catalog?.categories,
    products: (catalog?.products ?? []).map((p: Loose, index: number) => ({
      index,
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.price,
      featured: p.featured ?? false,
      available: p.available ?? true,
    })),
    sectionTypes: S.SECTION_TYPES,
    linkTokens: S.LINK_TOKENS,
    images: Object.keys(imageManifest()),
  }
}

// ── Translations ───────────────────────────────────────────────────────────────

export interface TranslationFile {
  locale: string
  /** Repo-relative translation file */
  file: string
  /** Default-language file it translates */
  base: string
  exists: boolean
  /** Translatable texts of the default-language file, and how many of them the translation provides */
  total: number
  translated: number
  /** Texts shown in the default language; paths read like sections[id=start].headline[0].text */
  missing: MissingText[]
}

export const percent = (part: number, total: number) => `${total ? Math.floor((part / total) * 100) : 100}%`

/** Key that identifies an array item in translations (same order as keyOf in src/content/i18n.ts) */
const arrayKey = (v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v) ? (['id', 'slug', 'date'].find((k) => typeof (v as Loose)[k] === 'string') ?? null) : null

/** "sections.start.headline.0.text" (dot path of i18n.ts) → "sections[id=start].headline[0].text" */
function readablePath(base: unknown, dotPath: string): string {
  let node = base as Loose | undefined
  let out = ''
  for (const seg of dotPath.split('.')) {
    if (Array.isArray(node) && node.length && node.every(arrayKey)) {
      const item = node.find((v) => v[arrayKey(v)!] === seg)
      out += `[${arrayKey(item)}=${seg}]`
      node = item
    } else if (Array.isArray(node)) {
      out += `[${seg}]`
      node = node[Number(seg)]
    } else {
      out += out ? `.${seg}` : seg
      node = node?.[seg]
    }
  }
  return out
}

/**
 * Completeness of every translation file (translationStatus() of src/content/validate.ts) with readable paths.
 * undefined while the content is invalid: translations are compared with the validated default-language content.
 */
export function translations(): { defaultLocale: string; files: TranslationFile[] } | undefined {
  const { content } = loadContent(ROOT)
  if (!content) return undefined
  const baseData = (base: string): unknown =>
    base === CONTENT_FILES.site
      ? content.site
      : base === CONTENT_FILES.catalog
        ? content.catalog
        : content.pages.find((p) => p.path === (readJsonFile(base) as Loose).path)
  return {
    defaultLocale: content.defaultLocale,
    files: translationStatus(ROOT).map(({ locale, file, missing }) => {
      const base = file.replace(/^src\/data\/i18n\/[^/]+\//, 'src/data/')
      const data = baseData(base)
      const total = missingTranslations(data as never, undefined).length
      return {
        locale,
        file,
        base,
        exists: existsSync(path.join(ROOT, file)),
        total,
        translated: total - missing.length,
        missing: missing.map((m) => ({ path: readablePath(data, m.path), source: m.source })),
      }
    }),
  }
}

/**
 * Keys a translation file must leave out: technical string keys (NOT_TRANSLATABLE of src/content/i18n.ts) and whole
 * settings subtrees — found by probing i18n.ts with every key of the schemas, so this list never drifts from it.
 */
export function technicalKeys(): { keys: string[]; trees: string[] } {
  const names = new Set<string>()
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) {
        if (k === 'properties' && x && typeof x === 'object') Object.keys(x).forEach((n) => names.add(n))
        walk(x)
      }
  }
  for (const name of ['site', 'catalog', 'page'] as const) walk(jsonSchema(name))
  const trees = [...names].filter((k) => !missingTranslations({ [k]: { probe: 'text' } } as never, undefined).length)
  return { keys: [...NOT_TRANSLATABLE].filter((k) => k !== '$schema').sort(), trees: trees.sort() }
}

/** How translation overlays work (Markdown) — shared by schema/README.md, the MCP server and npm run ai. */
export function translationRules(): string {
  const { keys, trees } = technicalKeys()
  const code = (list: string[]) => list.map((k) => `\`${k}\``).join(', ')
  return [
    'The files in `src/data` are the default language (Polish, served at `/`). Every other language of `site.json → i18n.locales`',
    'is a **text-only overlay** in `src/data/i18n/<locale>/` with the same file names: `site.json`, `products.json` and',
    '`pages/<name>.json` (`reviews.json` is never translated). Structure, links, images, prices, hours, colours and every setting',
    'come from the Polish file; a text the overlay leaves out — or a whole missing file — is shown in Polish.',
    '',
    '- **Same shape, texts only.** Put each translation at the path of the Polish text. Objects may contain only keys that exist',
    '  in the Polish file (the labels of `site.json → ui` count even where the Polish file relies on their defaults).',
    '- **Arrays of objects with `id` (sections) or `slug` (products, categories)** are matched by that key: every overlay item',
    '  contains its unchanged `id`/`slug`; order does not matter and items can be left out.',
    '- **All other arrays** (headline lines, paragraphs, list items, FAQ items, nav and footer links, buttons, ticker…) are matched',
    '  by position: item N translates item N, and the overlay is never longer than the Polish array. `null` keeps an item in Polish.',
    '- **Never in an overlay:** numbers, `true`/`false`, the settings subtrees and the technical keys (except the `id`/`slug`',
    '  that identifies an array item) — leave them out:',
    `  subtrees ${code(trees)};`,
    `  keys ${code(keys)}.`,
    '- **Facts stay the same.** Translate what the Polish text says — add no facts, prices, ingredients or promises. Keep brand',
    '  names (Słodko Mi, Wolt, Google, Biscoff, Oreo) and street names as in Polish. SEO limits apply in every language',
    '  (`seo.title` ≤ 60, `seo.description` ≤ 155 characters).',
    '- **Keep translations in sync.** When a Polish text changes, update its translation in every language in the same edit (or',
    '  remove it so it falls back to Polish). When items of a position-matched array are added, removed or reordered in Polish,',
    '  do the same in every translation — otherwise the translations shift to the wrong items.',
    '- **Missing texts** are listed by `npm run i18n:status -- --missing` (MCP: `translation_status`) with paths like',
    '  `sections[id=faq].items[2].answer`: `[id=…]`/`[slug=…]`/`[date=…]` is the item with that key, `[2]` the third item.',
    '- **Validation:** `npm run content:check` merges every overlay with the Polish file and validates the result — an unknown key,',
    '  a technical key, a wrong type or an `id`/`slug` the Polish file does not have is an error. `npm run i18n:check` fails while',
    '  texts are missing (CI only warns: missing texts fall back to Polish).',
  ].join('\n')
}

// ── JSON Schemas ───────────────────────────────────────────────────────────────

export const SCHEMA_DIR = 'schema'
export type SchemaName = 'site' | 'catalog' | 'reviews' | 'page'

const ROOTS: Record<SchemaName, { schema: z.ZodType; title: string; files: string }> = {
  site: { schema: S.Site, title: 'SŁODKO MI — global settings', files: 'src/data/site.json' },
  catalog: { schema: S.Catalog, title: 'SŁODKO MI — product catalogue', files: 'src/data/products.json' },
  reviews: { schema: S.Reviews, title: 'SŁODKO MI — Google reviews', files: 'src/data/reviews.json' },
  page: { schema: S.Page, title: 'SŁODKO MI — page', files: 'src/data/pages/*.json' },
}

const sectionDefName = (type: string) => `${type[0].toUpperCase()}${type.slice(1)}Section`

let named = false
/** Gives reused schemas stable names, so they land in $defs instead of being repeated inline. */
function nameSharedSchemas() {
  if (named) return
  named = true
  const shared: Record<string, z.ZodType> = {
    Href: S.Href,
    Cta: S.Cta,
    Image: S.Image,
    Video: S.Video,
    Tone: S.Tone,
    NavLink: S.NavLink,
    Seo: S.Seo,
    Category: S.Category,
    Product: S.Product,
    Review: S.Review,
  }
  for (const option of S.Section.options) shared[sectionDefName(option.shape.type.value)] = option
  // Merge with existing metadata so .describe() texts survive
  for (const [id, schema] of Object.entries(shared)) z.globalRegistry.add(schema, { ...z.globalRegistry.get(schema), id })
}

/** JSON Schema (draft 2020-12) of one content file kind; io "input" → fields with defaults are optional. */
export function jsonSchema(name: SchemaName): Record<string, unknown> {
  nameSharedSchemas()
  const { schema, title, files } = ROOTS[name]
  const { $schema, ...rest } = z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown>
  return {
    $schema,
    title,
    description: `Contract for ${files}. Generated from src/content/schema.ts by \`npm run content:schema\` — do not edit by hand.`,
    ...rest,
  }
}

export const SCHEMA_NAMES = Object.keys(ROOTS) as SchemaName[]

/** Markdown catalogue of section types with their fields (from the same Zod schemas). */
export function sectionCatalog(): string {
  nameSharedSchemas()
  const typeOf = (p: Loose): string => {
    if (p.$ref) return String(p.$ref).split('/').pop()!
    if ('const' in p) return JSON.stringify(p.const)
    if (p.enum) return p.enum.map((v: unknown) => JSON.stringify(v)).join(' \\| ')
    if (p.anyOf || p.oneOf) return (p.anyOf ?? p.oneOf).map(typeOf).join(' \\| ')
    if (p.type === 'array') {
      const item = typeOf(p.items ?? {})
      return item.includes(' \\| ') ? `(${item})[]` : `${item}[]`
    }
    // Small objects inline, e.g. { mode: "category", category: string }
    if (p.type === 'object' && p.properties && Object.keys(p.properties).length <= 3)
      return `{ ${Object.entries<Loose>(p.properties).map(([k, v]) => `${k}: ${typeOf(v)}`).join(', ')} }`
    return p.type ?? 'any'
  }
  const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
  const defs = (z.toJSONSchema(S.Page, { io: 'input' }) as Loose).$defs
  const out: string[] = []
  for (const option of S.Section.options) {
    const type = option.shape.type.value
    const js = defs[sectionDefName(type)] as Loose
    out.push(`### \`${type}\``, '', option.description ?? '', '', '| Field | Type | Required | Description |', '| --- | --- | --- | --- |')
    // Nested objects (e.g. split.left) are listed field by field as "left.title"
    const rows = (obj: Loose, prefix: string) => {
      for (const [key, prop] of Object.entries<Loose>(obj.properties ?? {})) {
        const def = prop.default !== undefined ? ` (default: \`${JSON.stringify(prop.default)}\`)` : ''
        out.push(`| \`${prefix}${key}\` | ${typeOf(prop)} | ${obj.required?.includes(key) ? 'yes' : ''} | ${cell(((prop.description ?? '') + def).trim())} |`)
        if (prop.type === 'object' && Object.keys(prop.properties ?? {}).length > 3) rows(prop, `${prefix}${key}.`)
      }
    }
    rows(js, '')
    out.push('')
  }
  return out.join('\n')
}

/** Every file of the schema/ folder: path → content. */
export function schemaFiles(): Record<string, string> {
  const files: Record<string, string> = {}
  for (const name of SCHEMA_NAMES) files[`${SCHEMA_DIR}/${name}.schema.json`] = JSON.stringify(jsonSchema(name), null, 2) + '\n'
  files[`${SCHEMA_DIR}/README.md`] = [
    '# Content schemas',
    '',
    '> Generated from `src/content/schema.ts` by `npm run content:schema` — do not edit by hand.',
    '> `npm run content:check` fails when these files are out of date.',
    '',
    'JSON Schema (draft 2020-12) of every editable content file. The data files point at them via `$schema`,',
    'so editors (VS Code, Cursor…) autocomplete and validate while you type. Unknown or misspelled keys are errors',
    '(`additionalProperties: false`), never silently ignored. Cross-file rules (image keys exist, product slugs and',
    'internal links resolve, section ids are unique) are checked by `npm run content:check`.',
    '',
    '| Schema | Files |',
    '| --- | --- |',
    ...SCHEMA_NAMES.map((n) => `| [\`${n}.schema.json\`](./${n}.schema.json) | \`${ROOTS[n].files}\` |`),
    '',
    '## Link targets',
    '',
    'Every `href` accepts an internal path (`/`, `/o-nas`, `/#smaki`, `/produkt/<slug>`), an absolute URL, `tel:`/`mailto:`',
    `or a token resolved from \`site.json\`: ${S.LINK_TOKENS.map((t) => `\`${t}\``).join(', ')}.`,
    'A bare `#id` works only inside one page file — `site.json` and `products.json` must use `/#id`. The target section',
    'must exist and be shown: links to a section with `"enabled": false` (or a product grid without products) fail.',
    '',
    '## Translations (`src/data/i18n/<locale>/`)',
    '',
    translationRules(),
    '',
    'Overlays have no JSON Schema of their own (every key is optional and only texts are allowed): `npm run content:check`',
    'validates them by merging them with the Polish file and checking the result against the schemas above.',
    '',
    '## Section types',
    '',
    'A page is an ordered list of sections (`sections[]`). Each one has `id` (unique, also the `#anchor`), `type`',
    'and `enabled` (false hides it). Available types:',
    '',
    sectionCatalog(),
  ].join('\n')
  return files
}

// ── Processes ──────────────────────────────────────────────────────────────────

/** Runs a command in the repo root and captures its output (never inherits stdout — MCP-safe). */
export function run(command: string, args: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (d) => (output += d))
    child.stderr.on('data', (d) => (output += d))
    child.on('error', (e) => resolve({ code: 1, output: output + String(e) }))
    child.on('close', (code) => resolve({ code: code ?? 1, output }))
  })
}

export const tail = (text: string, lines = 60) => text.trimEnd().split('\n').slice(-lines).join('\n')
