/**
 * npm run docs:reference — regenerates the field tables of docs/CONTENT-REFERENCE.md (between the
 * GENERATED markers) from the JSON Schemas of src/content/schema.ts, so the docs list every field with its
 * type, default, rules, description and whether translation overlays may contain it. Commit the output.
 *
 *   --check   do not write; exit 1 when the tables are out of date
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { applyOverlay, NOT_TRANSLATABLE } from '../src/content/i18n.ts'
import { jsonSchema, ROOT, type SchemaName } from './lib/content-store.ts'

type JS = Record<string, any>

const FILE = path.join(ROOT, 'docs/CONTENT-REFERENCE.md')
const START = '<!-- BEGIN GENERATED: npm run docs:reference -->'
const END = '<!-- END GENERATED -->'

/** Types documented once in "Shared types" and linked from every field that uses them. */
const SHARED = ['Href', 'Cta', 'Image', 'Video', 'NavLink', 'Seo', 'Tone']

const PATTERNS: Record<string, string> = {
  '^([01]\\d|2[0-3]):[0-5]\\d$': '`HH:MM` (24 h)',
  '^#[0-9a-fA-F]{6}$': '`#RRGGBB`',
  '^\\+\\d{9,15}$': 'E.164, e.g. `+48511228221`',
  '^[a-z0-9-]+$': '`a-z`, `0-9`, `-`',
  '^\\d{2}-\\d{3}$': '`00-000`',
  '^[a-z]{2}$': '2 lowercase letters',
}

interface Row {
  path: string
  type: string
  required: boolean
  def: string
  rules: string
  i18n: string
  desc: string
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
const code = (v: unknown) => `\`${JSON.stringify(v)}\``
const anchor = (name: string) => `[${name}](#${name.toLowerCase()})`

/**
 * Whether a translation overlay may set the value at `keys` ("[]" = array item). Asks the real overlay
 * code (src/content/i18n.ts): a different string at that place must be accepted without errors.
 */
function translatable(keys: string[], kind: 'text' | 'texts'): boolean {
  // A list of identifiers (e.g. spotlight.productSlugs) is a setting even where its items would be accepted
  if (kind === 'texts' && NOT_TRANSLATABLE.has(keys.at(-1)!)) return false
  const build = (leaf: unknown): unknown => keys.reduceRight<unknown>((child, k) => (k === '[]' ? [child] : { [k]: child }), leaf)
  const errors: string[] = []
  applyOverlay(build(kind === 'texts' ? ['a'] : 'a') as never, build(kind === 'texts' ? ['b'] : 'b') as never, errors)
  return errors.length === 0
}

const range = (min: number | undefined, max: number | undefined, unit = '') =>
  min === max ? `exactly ${min}${unit}` : max === undefined ? `≥ ${min}${unit}` : min === undefined ? `≤ ${max}${unit}` : `${min}–${max}${unit}`
const oneOf = (values: unknown[]) => values.map((v) => `\`${v}\``).join(', ')

function rulesOf(s: JS): string[] {
  const out: string[] = []
  if (s.format === 'includes') out.push(`must contain \`${s.pattern}\``)
  else if (s.format) out.push(`format: ${s.format}`)
  else if (s.pattern) out.push(PATTERNS[s.pattern] ?? `pattern \`${s.pattern}\``)
  if (s.maxLength !== undefined) out.push(range(s.minLength > 1 ? s.minLength : undefined, s.maxLength, ' chars'))
  if (s.minItems !== undefined || s.maxItems !== undefined) out.push(range(s.minItems, s.maxItems, ' items'))
  // zod writes the safe-integer limits for every int(); they are no rule worth listing
  const max = s.maximum === Number.MAX_SAFE_INTEGER ? undefined : s.maximum
  const min = s.minimum === Number.MIN_SAFE_INTEGER ? undefined : s.minimum
  if (min !== undefined || max !== undefined) out.push(range(min, max))
  if (s.exclusiveMinimum !== undefined) out.push(`> ${s.exclusiveMinimum}`)
  if (s.enum && s.enum.length > 4) out.push(`one of: ${oneOf(s.enum)}`)
  if (s.items?.enum) out.push(`items: ${oneOf(s.items.enum)}`)
  if (s.propertyNames?.enum) out.push(`keys: ${oneOf(s.propertyNames.enum)}`)
  return out
}

class Walker {
  rows: Row[] = []
  constructor(
    private defs: JS,
    /** Key path used for the translatability test (null = file is never translated) */
    private i18nPrefix: string[] | null,
  ) {}

  private resolve(s: JS): { node: JS; ref?: string } {
    if (!s.$ref) return { node: s }
    const ref = String(s.$ref).split('/').pop()!
    const { $ref: _ignored, ...own } = s
    return { node: { ...this.defs[ref], ...own }, ref }
  }

  private typeOf(s: JS): string {
    const { node, ref } = this.resolve(s)
    if (ref && SHARED.includes(ref)) return anchor(ref)
    if ('const' in node) return code(node.const)
    if (node.enum) return node.enum.length > 4 ? (node.type ?? 'string') : node.enum.map(code).join(' | ')
    const union: JS[] | undefined = node.anyOf ?? node.oneOf
    if (union) {
      const types = [...new Set(union.map((v) => this.typeOf(v)))]
      // Shapes of one object (hours, source…) are listed field by field below the row
      return types.every((t) => t === 'object') ? 'object' : types.join(' | ')
    }
    if (node.type === 'array') {
      if (node.prefixItems) return `[${node.prefixItems.map((v: JS) => this.typeOf(v)).join(', ')}]`
      const item = this.typeOf(node.items ?? {})
      return item.includes(' | ') ? `(${item})[]` : `${item}[]`
    }
    if (node.type === 'object' && node.propertyNames) return `{ [${this.typeOf(node.propertyNames)}]: ${this.typeOf(node.additionalProperties)} }`
    if (node.type === 'string' && node.minLength === 1) return 'text'
    return node.type ?? 'any'
  }

  /** Text leaves (string, string[] or tuple of strings) can be translated; everything else is a setting. */
  private i18nOf(node: JS, keys: string[]): string {
    if (!this.i18nPrefix) return '—'
    const isText = (n: JS) => n.type === 'string' && !n.enum && !('const' in n)
    const items = node.type === 'array' ? (node.prefixItems?.[0] ?? node.items) : undefined
    const kind = isText(node) ? 'text' : items && isText(this.resolve(items).node) ? 'texts' : null
    // A record of texts (ui.allergenNames): ask about one of its keys
    if (!kind && node.propertyNames?.enum && isText(this.resolve(node.additionalProperties ?? {}).node))
      return translatable([...this.i18nPrefix, ...keys, node.propertyNames.enum[0]], 'text') ? 'yes' : ''
    if (!kind) return ''
    return translatable([...this.i18nPrefix, ...keys], kind) ? 'yes' : ''
  }

  field(name: string, keys: string[], s: JS, required: boolean, variant?: string) {
    const { node, ref } = this.resolve(s)
    const isShared = ref !== undefined && SHARED.includes(ref)
    // A shared type's own description lives in its table; here only what this field adds
    const own = isShared ? s.description : node.description
    const desc = [own ?? '', variant ? `Only in the shape with ${variant}.` : ''].filter(Boolean).join(' ')
    const def = node.default === undefined ? '' : JSON.stringify(node.default)
    this.rows.push({
      path: name,
      type: this.typeOf(s),
      required,
      def: def.length > 90 ? `\`${def.slice(0, 87)}…\`` : def && `\`${def}\``,
      rules: isShared ? '' : rulesOf(node).join('; '),
      i18n: isShared ? '' : this.i18nOf(node, keys),
      desc,
    })
    if (!isShared) this.children(name, keys, node)
  }

  /** Nested fields of objects, arrays of objects and unions of object shapes. */
  children(name: string, keys: string[], node: JS) {
    if (node.type === 'object' && node.properties) return this.object(name, keys, node)
    const union: JS[] | undefined = node.anyOf ?? node.oneOf
    if (union) {
      // Unions of named types (the section types) are documented one table per type
      if (union.every((v) => v.$ref)) return
      const shapes = union.map((v) => this.resolve(v)).filter((r) => r.node.type === 'object' && r.node.properties && !(r.ref && SHARED.includes(r.ref)))
      if (shapes.length !== union.length || shapes.length < 2) return
      // Every key of every shape once; keys missing from some shapes say which shape they belong to
      const seen = new Set<string>()
      for (const { node: shape } of shapes)
        for (const [key, prop] of Object.entries<JS>(shape.properties)) {
          if (seen.has(key)) continue
          seen.add(key)
          const owners = shapes.filter(({ node: n }) => key in n.properties)
          const variant =
            owners.length === shapes.length ? undefined : owners.map(({ node: n }) => `{ ${Object.keys(n.properties).join(', ')} }`).join(' or ')
          const merged = owners.length > 1 && owners.some(({ node: n }) => JSON.stringify(n.properties[key]) !== JSON.stringify(prop))
          this.field(`${name}.${key}`, [...keys, key], merged ? { anyOf: owners.map(({ node: n }) => n.properties[key]) } : prop, owners.every(({ node: n }) => n.required?.includes(key)), variant)
        }
      return
    }
    if (node.type === 'array' && node.items) {
      const { node: item, ref } = this.resolve(node.items)
      if (ref && SHARED.includes(ref)) return
      this.children(`${name}[]`, [...keys, '[]'], item)
    }
  }

  object(prefix: string, keys: string[], node: JS) {
    for (const [key, prop] of Object.entries<JS>(node.properties)) {
      if (key === '$schema') continue
      this.field(prefix ? `${prefix}.${key}` : key, [...keys, key], prop, node.required?.includes(key) ?? false)
    }
  }
}

function table(rows: Row[]): string[] {
  return [
    '| Field | Type | Req. | Default | Rules | i18n | Description |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| \`${r.path}\` | ${cell(r.type)} | ${r.required ? 'yes' : ''} | ${cell(r.def)} | ${cell(r.rules)} | ${r.i18n} | ${cell(r.desc)} |`),
  ]
}

function fileTable(name: SchemaName, i18n: boolean): { lines: string[]; defs: JS } {
  const schema = jsonSchema(name)
  const w = new Walker((schema.$defs as JS) ?? {}, i18n ? [] : null)
  w.object('', [], schema as JS)
  return { lines: table(w.rows), defs: (schema.$defs as JS) ?? {} }
}

function generate(): string {
  const out: string[] = [
    START,
    '',
    '## Field reference (generated)',
    '',
    '> Generated from `src/content/schema.ts` by `npm run docs:reference` — do not edit this part by hand.',
    '',
    'Columns: **Req.** = must be present (fields with a default may be left out); **Default** = value used when the field is',
    'missing; **i18n** = `yes` when a translation overlay (`src/data/i18n/<locale>/…`) may contain this field — every other',
    'field is a setting that only the Polish file holds. `a.b` = nested key, `a[]` = every item of array `a`.',
    '',
  ]
  const site = fileTable('site', true)
  out.push('### `src/data/site.json`', '', ...site.lines, '')
  const catalog = fileTable('catalog', true)
  out.push('### `src/data/products.json`', '', ...catalog.lines, '')
  out.push('### `src/data/reviews.json` (read-only, never translated)', '', ...fileTable('reviews', false).lines, '')
  const page = fileTable('page', true)
  out.push(
    '### `src/data/pages/<name>.json`',
    '',
    ...page.lines,
    '',
    '### Section types',
    '',
    'Every item of `sections[]` is one of these shapes, chosen by `type`. Common fields: `id` (unique on the page, also the',
    '`#anchor`), `type`, `enabled` (default `true`).',
    '',
  )
  for (const [defName, def] of Object.entries<JS>(page.defs)) {
    if (!defName.endsWith('Section')) continue
    const w = new Walker(page.defs, ['sections', '[]'])
    w.object('', [], def)
    out.push(`#### \`${def.properties.type.const}\``, '', ...(def.description ? [def.description, ''] : []), ...table(w.rows), '')
  }
  out.push('### Shared types', '')
  const allDefs: JS = { ...site.defs, ...catalog.defs, ...page.defs }
  for (const name of SHARED) {
    const def = allDefs[name]
    if (!def) continue
    out.push(`#### ${name}`, '', ...(def.description ? [def.description, ''] : []))
    if (def.type === 'object') {
      const w = new Walker(allDefs, ['x'])
      w.object('', [], def)
      out.push(...table(w.rows), '')
    } else {
      out.push(`Type: ${def.enum ? def.enum.map(code).join(' | ') : def.type}${def.minLength ? ' (non-empty)' : ''}`, '')
    }
  }
  out.push(END)
  return out.join('\n')
}

const current = readFileSync(FILE, 'utf8')
const [start, end] = [current.indexOf(START), current.indexOf(END)]
if (start < 0 || end < start) {
  console.error(`✗ ${path.relative(ROOT, FILE)} has no "${START}" … "${END}" markers`)
  process.exit(1)
}
const next = current.slice(0, start) + generate() + current.slice(end + END.length)
if (process.argv.includes('--check')) {
  if (next !== current) {
    console.error('✗ docs/CONTENT-REFERENCE.md is out of date — run `npm run docs:reference`')
    process.exit(1)
  }
  console.log('✓ docs/CONTENT-REFERENCE.md is up to date')
} else {
  writeFileSync(FILE, next)
  console.log(next === current ? '✓ docs/CONTENT-REFERENCE.md already up to date' : '✓ Updated docs/CONTENT-REFERENCE.md')
}
