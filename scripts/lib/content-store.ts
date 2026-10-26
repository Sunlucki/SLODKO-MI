/**
 * Shared core of the LLM editing tools (scripts/content-mcp.ts, scripts/ai-edit.ts, scripts/export-schema.ts):
 * a strict whitelist of editable files, a JSON formatter matching the style of src/data, transactional
 * writes validated with loadContent() (automatic rollback), JSON Schema export and a content overview.
 * Node-only. Paths resolve from the repo root, so the tools work from any working directory.
 */
import { spawn } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jsonpatch, { type Operation } from 'fast-json-patch'
import { z } from 'zod'
import * as S from '../../src/content/schema.ts'
import { CONTENT_FILES, loadContent, type ImageManifest } from '../../src/content/validate.ts'

export type { Operation }

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// ── Editable files ─────────────────────────────────────────────────────────────

const EDITABLE = /^src\/data\/(?:(?:site|products|reviews)\.json|pages\/[a-z0-9-]+\.json)$/
export const PROTECTED_PAGE = 'src/data/pages/home.json'

/** $schema value written into each kind of file (relative to the file, for editor autocompletion). */
function schemaRef(rel: string): string {
  if (rel.startsWith('src/data/pages/')) return '../../../schema/page.schema.json'
  const name = { 'src/data/site.json': 'site', 'src/data/products.json': 'catalog', 'src/data/reviews.json': 'reviews' }[rel]
  return `../../schema/${name}.schema.json`
}

/**
 * Normalises a content path ("src/data/site.json", "site.json", "pages/o-nas.json" or an absolute path
 * inside the repo) and rejects anything outside the whitelist — no traversal, no symlinks.
 */
export function contentPath(file: string): { rel: string; abs: string } {
  let rel = file.trim().replace(/\\/g, '/')
  if (path.isAbsolute(rel)) rel = path.relative(ROOT, rel).replace(/\\/g, '/')
  rel = path.posix.normalize(rel).replace(/^\.\//, '')
  if (!rel.startsWith('src/')) rel = `src/data/${rel}`
  if (!EDITABLE.test(rel))
    throw new Error(
      `"${file}" is not an editable content file. Allowed: src/data/site.json, src/data/products.json, ` +
        'src/data/reviews.json, src/data/pages/<slug>.json (slug: a-z, 0-9, "-").',
    )
  const abs = path.join(ROOT, rel)
  if (existsSync(abs) && lstatSync(abs).isSymbolicLink()) throw new Error(`"${rel}" is a symlink — refusing to touch it`)
  return { rel, abs }
}

/** All editable files that exist now (pages sorted by name). */
export function listContentFiles(): string[] {
  const pages = readdirSync(path.join(ROOT, CONTENT_FILES.pagesDir))
    .filter((f) => /^[a-z0-9-]+\.json$/.test(f))
    .sort()
    .map((f) => `${CONTENT_FILES.pagesDir}/${f}`)
  return [CONTENT_FILES.site, CONTENT_FILES.catalog, CONTENT_FILES.reviews, ...pages]
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

/** Serialises a content document: "$schema" first (editor autocompletion), house formatting, trailing newline. */
export function serialize(rel: string, doc: unknown): string {
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    const { $schema: _ignored, ...rest } = doc as Record<string, unknown>
    doc = { $schema: schemaRef(rel), ...rest }
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

/**
 * Writes all changes, validates the whole content with loadContent() and restores the original files
 * when the change introduces any new error. Pre-existing errors do not block a change.
 */
export function commit(changes: Change[]): CommitResult {
  const before = new Set(loadContent(ROOT).errors)
  const originals = new Map(changes.map((c) => [c.rel, readText(c.rel)]))
  const write = (rel: string, text: string | null) => {
    const abs = contentPath(rel).abs
    if (text === null) rmSync(abs, { force: true })
    else writeFileSync(abs, text)
  }
  try {
    for (const c of changes) write(c.rel, c.text)
    const errors = loadContent(ROOT).errors
    const introduced = errors.filter((e) => !before.has(e))
    if (introduced.length) {
      restore(originals)
      return { ok: false, errors: introduced, originals }
    }
    return { ok: true, errors, originals }
  } catch (e) {
    restore(originals)
    throw e
  }
}

export function restore(originals: Map<string, string | null>) {
  for (const [rel, text] of originals) {
    const abs = contentPath(rel).abs
    if (text === null) rmSync(abs, { force: true })
    else writeFileSync(abs, text)
  }
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
  return {
    valid: errors.length === 0,
    errors,
    files: listContentFiles(),
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
    'so editors (VS Code, Cursor…) autocomplete and validate while you type. Cross-file rules (image keys exist,',
    'product slugs and internal links resolve, section ids are unique) are checked by `npm run content:check`.',
    '',
    '| Schema | Files |',
    '| --- | --- |',
    ...SCHEMA_NAMES.map((n) => `| [\`${n}.schema.json\`](./${n}.schema.json) | \`${ROOTS[n].files}\` |`),
    '',
    '## Link targets',
    '',
    'Every `href` accepts an internal path (`/`, `/o-nas`, `/#smaki`, `/produkt/<slug>`), an absolute URL, `tel:`/`mailto:`',
    `or a token resolved from \`site.json\`: ${S.LINK_TOKENS.map((t) => `\`${t}\``).join(', ')}.`,
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
