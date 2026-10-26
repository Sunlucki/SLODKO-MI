/**
 * Node-only: loads every content file, validates it against the Zod schemas and
 * checks cross-references (images, product slugs, internal links, anchors).
 * Used by the Vite content plugin (dev + build), `npm run content:check`,
 * the MCP server and the AI edit CLI — so every editor hits the same rules.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { ZodType } from 'zod'
import { applyOverlay, missingTranslations, type MissingText } from './i18n.ts'
import { Catalog, LINK_TOKENS, Page, Reviews, Site, type CatalogT, type PageT, type ReviewsT, type SectionOf, type SiteT } from './schema.ts'

export type ImageManifest = Record<string, { width: number; height: number; widths: number[]; alpha: boolean }>

/** Content of one language version */
export interface LocaleData {
  site: SiteT
  catalog: CatalogT
  reviews: ReviewsT
  pages: PageT[]
}

/** Default-language content (top level, as before) plus every language version in `locales`. */
export interface Content extends LocaleData {
  images: ImageManifest
  defaultLocale: string
  locales: Record<string, LocaleData>
}

export const CONTENT_FILES = {
  site: 'src/data/site.json',
  catalog: 'src/data/products.json',
  reviews: 'src/data/reviews.json',
  pagesDir: 'src/data/pages',
  i18nDir: 'src/data/i18n',
  images: 'src/generated/images.json',
} as const

/** Translation files of every language: src/data/i18n/<locale>/(site|products).json and pages/*.json */
function translationFiles(root: string): string[] {
  const dir = path.join(root, CONTENT_FILES.i18nDir)
  if (!existsSync(dir)) return []
  const walk = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.json') ? [path.join(d, e.name)] : []))
  return walk(dir).sort()
}

export function contentFiles(root: string): string[] {
  const dir = path.join(root, CONTENT_FILES.pagesDir)
  return [
    CONTENT_FILES.site,
    CONTENT_FILES.catalog,
    CONTENT_FILES.reviews,
    CONTENT_FILES.images,
    ...readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => path.join(CONTENT_FILES.pagesDir, f)),
  ]
    .map((f) => path.join(root, f))
    .concat(translationFiles(root))
}

function readJson(file: string, errors: string[]): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${(e as Error).message}`)
    return undefined
  }
}

function parse<T>(schema: ZodType<T>, data: unknown, file: string, errors: string[]): T | undefined {
  if (data === undefined) return undefined
  const res = schema.safeParse(data)
  if (res.success) return res.data
  for (const issue of res.error.issues) errors.push(`${file} → ${issue.path.join('.') || '(root)'}: ${issue.message}`)
  return undefined
}

/** Walk any value and yield [jsonPath, object] for every nested object. */
function* objects(value: unknown, p: string[] = []): Generator<[string[], Record<string, unknown>]> {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* objects(value[i], [...p, String(i)])
  } else if (value && typeof value === 'object') {
    yield [p, value as Record<string, unknown>]
    for (const [k, v] of Object.entries(value)) yield* objects(v, [...p, k])
  }
}

export interface LoadResult {
  content?: Content
  errors: string[]
  /** Files (repo-relative) that are not valid JSON or do not match their schema; checks that need them are skipped */
  invalid: string[]
}

const normPath = (p: string) => p.replace(/\/$/, '') || '/'

export function loadContent(root = process.cwd()): LoadResult {
  const errors: string[] = []
  const invalid: string[] = []
  const rel = (f: string) => path.relative(root, f).split(path.sep).join('/')
  const load = <T>(schema: ZodType<T>, file: string, raw = readJson(file, errors)): T | undefined => {
    const data = parse(schema, raw, rel(file), errors)
    if (data === undefined) invalid.push(rel(file))
    return data
  }

  const imagesFile = path.join(root, CONTENT_FILES.images)
  const images = (existsSync(imagesFile) ? readJson(imagesFile, errors) : {}) as ImageManifest | undefined
  if (!images) invalid.push(CONTENT_FILES.images)

  const site = load(Site, path.join(root, CONTENT_FILES.site))
  const catalog = load(Catalog, path.join(root, CONTENT_FILES.catalog))
  const reviews = load(Reviews, path.join(root, CONTENT_FILES.reviews))

  const pagesDir = path.join(root, CONTENT_FILES.pagesDir)
  const pageFiles = contentFiles(root).filter((f) => path.dirname(f) === pagesDir)
  const pages: { file: string; page: PageT }[] = []
  // Paths of page files that failed validation: links to them cannot be checked, so they are skipped
  const unknownPaths = new Set<string>()
  for (const file of pageFiles) {
    const raw = readJson(file, errors)
    const page = load(Page, file, raw)
    if (page) pages.push({ file: rel(file), page })
    else if (typeof (raw as { path?: unknown } | undefined)?.path === 'string') unknownPaths.add(normPath((raw as { path: string }).path))
  }

  // ── Cross-reference checks ──────────────────────────────────────────────────
  // They run on every file that parsed, so one broken file never hides problems in the others.
  const productSlugs = catalog && new Set(catalog.products.map((p) => p.slug))
  const categorySlugs = catalog && new Set(catalog.categories.map((c) => c.slug))
  const pagePaths = new Map<string, string>()
  for (const { file, page } of pages) {
    const norm = normPath(page.path)
    if (pagePaths.has(norm)) errors.push(`${file} → path: "${page.path}" is already used by ${pagePaths.get(norm)}`)
    if (norm.startsWith('/produkt')) errors.push(`${file} → path: "/produkt…" is reserved for product pages`)
    pagePaths.set(norm, file)
  }
  if (!pagePaths.has('/') && !unknownPaths.has('/')) errors.push('src/data/pages: no page with path "/" (home page)')

  // A section is a link target only when it renders: enabled, and a product grid needs at least one product
  const gridCount = (s: SectionOf<'productGrid'>) => {
    if (!catalog) return 1
    const src = s.source
    if (src.mode === 'all') return catalog.products.length
    if (src.mode === 'featured') return catalog.products.filter((p) => p.featured).length
    if (src.mode === 'category') return catalog.products.filter((p) => p.category === src.category).length
    return src.slugs.filter((slug) => productSlugs?.has(slug)).length
  }
  // section id → null when it can be linked, otherwise why not
  const sectionsByPath = new Map<string, Map<string, string | null>>()
  for (const { page } of pages)
    sectionsByPath.set(
      normPath(page.path),
      new Map(
        page.sections.map((s) => [
          s.id,
          !s.enabled ? 'is disabled ("enabled": false)' : s.type === 'productGrid' && !gridCount(s) ? 'shows no products' : null,
        ]),
      ),
    )

  const checkImage = (where: string, src: string) => {
    if (images && !images[src])
      errors.push(`${where}: image "${src}" not found in ${CONTENT_FILES.images} (add the file to assets/images and run \`npm run images\`)`)
  }
  /** currentPath = path of the page the link is on; null for site-wide content (site.json, products.json). */
  const checkHref = (where: string, href: string, currentPath: string | null) => {
    if ((LINK_TOKENS as readonly string[]).includes(href)) {
      if (href === '@facebook' && site && !site.links.facebook) errors.push(`${where}: "@facebook" used but site.links.facebook is empty`)
      if (href === '@writeReview' && site && !site.links.writeReview) errors.push(`${where}: "@writeReview" used but site.links.writeReview is empty`)
      return
    }
    if (/^(https?:|mailto:|tel:)/.test(href)) return
    if (href.startsWith('#') && currentPath === null) {
      errors.push(`${where}: link "${href}" is shown on every page — use "/${href}" (a bare "#…" only works within one page file)`)
      return
    }
    const [rawPath, anchor] = href.split('#')
    const target = rawPath === '' ? currentPath! : normPath(rawPath)
    const product = target.match(/^\/produkt\/([^/]+)$/)
    if (product) {
      if (productSlugs && !productSlugs.has(product[1])) errors.push(`${where}: link "${href}" → unknown product "${product[1]}"`)
      return
    }
    if (unknownPaths.has(target)) return
    if (!pagePaths.has(target)) errors.push(`${where}: link "${href}" → no page with path "${target}"`)
    else if (anchor) {
      const reason = sectionsByPath.get(target)?.get(anchor)
      if (reason === undefined) errors.push(`${where}: link "${href}" → no section with id "${anchor}" on "${target}"`)
      else if (reason) errors.push(`${where}: link "${href}" → section "${anchor}" on "${target}" ${reason} — change or remove this link`)
    }
  }
  const scan = (file: string, data: unknown, currentPath: string | null) => {
    for (const [p, obj] of objects(data)) {
      const where = `${file} → ${p.join('.')}`
      if (typeof obj.src === 'string' && typeof obj.alt === 'string') checkImage(where, obj.src)
      if (typeof obj.href === 'string') checkHref(where, obj.href, currentPath)
      if (p.at(-1) === 'video' && typeof obj.src === 'string' && !existsSync(path.join(root, 'public', obj.src)))
        errors.push(`${where}: video "public/${obj.src}" does not exist`)
    }
  }

  if (site) {
    // Theme colours: keep WCAG AA contrast for the pairs the components actually use
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const contrast = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
      return (x + 0.05) / (y + 0.05)
    }
    const c = site.theme.colors
    const pairs: [keyof typeof c, keyof typeof c, number][] = [
      ['brandDeep', 'cream', 4.5], // buttons, small coloured text, frames
      ['brandDeep', 'blush', 4.5],
      ['ink', 'cream', 4.5],
      ['ink', 'blush', 4.5],
      ['ink', 'caramel', 4.5],
      ['cream', 'ink', 4.5],
      ['brand', 'cream', 3], // large display text only
      ['caramel', 'brandDeep', 4.5], // hero accent line + small text (logo line, header button, spotlight label)
    ]
    for (const [fg, bg, min] of pairs) {
      const ratio = contrast(c[fg], c[bg])
      if (ratio < min) errors.push(`${CONTENT_FILES.site} → theme.colors: ${fg} on ${bg} has contrast ${ratio.toFixed(2)}:1, needs ≥ ${min}:1 (WCAG AA)`)
    }

    scan(CONTENT_FILES.site, site, null)
    checkHref(`${CONTENT_FILES.site} → consent.policyHref`, site.consent.policyHref, null)
    if (images && !images[site.seo.ogImage]) errors.push(`${CONTENT_FILES.site} → seo.ogImage: "${site.seo.ogImage}" not found in images`)
  }
  if (catalog) scan(CONTENT_FILES.catalog, catalog, null)
  for (const { file, page } of pages) {
    scan(file, page, normPath(page.path))
    if (images && page.seo.ogImage && !images[page.seo.ogImage]) errors.push(`${file} → seo.ogImage: "${page.seo.ogImage}" not found in images`)
    // Exactly one <h1> per page: it comes from a hero, or from a text section with a heading placed first
    const enabled = page.sections.filter((s) => s.enabled)
    if (page.sections.filter((s) => s.type === 'hero').length > 1) errors.push(`${file} → sections: at most one "hero" section per page`)
    const first = enabled[0]
    if (first && !(first.type === 'hero' || (first.type === 'text' && first.heading)))
      errors.push(`${file} → sections: the first enabled section must be "hero" or a "text" section with a heading (it renders the page <h1>)`)
    else if (enabled.some((s, i) => i > 0 && s.type === 'hero')) errors.push(`${file} → sections: the "hero" section must be the first enabled section`)
    if (!productSlugs || !categorySlugs) continue
    page.sections.forEach((s, i) => {
      const where = `${file} → sections.${i} (${s.type} "${s.id}")`
      if (s.type === 'hero' && s.spotlight)
        for (const slug of s.spotlight.productSlugs) if (!productSlugs.has(slug)) errors.push(`${where}: spotlight product "${slug}" does not exist`)
      if (s.type === 'productGrid') {
        if (s.source.mode === 'manual') for (const slug of s.source.slugs) if (!productSlugs.has(slug)) errors.push(`${where}: product "${slug}" does not exist`)
        if (s.source.mode === 'category' && !categorySlugs.has(s.source.category)) errors.push(`${where}: category "${s.source.category}" does not exist`)
      }
    })
  }

  if (errors.length || !site || !catalog || !reviews || !images) return { errors, invalid }

  // ── Language versions ───────────────────────────────────────────────────────
  const base: LocaleData = { site, catalog, reviews, pages: pages.map((p) => p.page) }
  const locales: Record<string, LocaleData> = { [site.i18n.defaultLocale]: base }
  const known = new Set(site.i18n.locales.map((l) => l.code))
  const i18nDir = path.join(root, CONTENT_FILES.i18nDir)
  if (existsSync(i18nDir))
    for (const d of readdirSync(i18nDir, { withFileTypes: true }))
      if (d.isDirectory() && (!known.has(d.name) || d.name === site.i18n.defaultLocale))
        errors.push(`${CONTENT_FILES.i18nDir}/${d.name}: not a translation language in site.json → i18n.locales (or it is the default language)`)

  for (const { code } of site.i18n.locales) {
    if (code === site.i18n.defaultLocale) continue
    const dir = path.join(i18nDir, code)
    const translate = <T>(schema: ZodType<T>, baseData: T, file: string): T | undefined => {
      const full = path.join(dir, file)
      const overlay = existsSync(full) ? readJson(full, errors) : undefined
      const problems: string[] = []
      const merged = applyOverlay(baseData as never, (overlay ?? null) as never, problems)
      const where = rel(full)
      for (const p of problems) errors.push(`${where} → ${p}`)
      const res = schema.safeParse(merged)
      if (res.success) return res.data
      for (const issue of res.error.issues) errors.push(`${where} (merged with the default language) → ${issue.path.join('.')}: ${issue.message}`)
      return undefined
    }
    const pageDir = path.join(dir, 'pages')
    if (existsSync(pageDir))
      for (const f of readdirSync(pageDir))
        if (f.endsWith('.json') && !existsSync(path.join(pagesDir, f))) errors.push(`${rel(path.join(pageDir, f))}: no page "${f}" in ${CONTENT_FILES.pagesDir}`)
    const lsite = translate(Site, site, 'site.json')
    const lcatalog = translate(Catalog, catalog, 'products.json')
    const lpages = pages.map(({ file, page }) => translate(Page, page, path.join('pages', path.basename(file))))
    if (lsite && lcatalog && lpages.every(Boolean)) locales[code] = { site: lsite, catalog: lcatalog, reviews, pages: lpages as PageT[] }
  }

  if (errors.length) return { errors, invalid }
  return { content: { ...base, images, defaultLocale: site.i18n.defaultLocale, locales }, errors, invalid }
}

export interface TranslationStatus {
  locale: string
  /** Repo-relative translation file */
  file: string
  missing: MissingText[]
}

/** Texts of the default language that a translation does not provide yet (they show in the default language). */
export function translationStatus(root = process.cwd()): TranslationStatus[] {
  const { content } = loadContent(root)
  if (!content) return []
  const out: TranslationStatus[] = []
  const rel = (f: string) => path.relative(root, f).split(path.sep).join('/')
  const pageFile = new Map(contentFiles(root).filter((f) => path.dirname(f) === path.join(root, CONTENT_FILES.pagesDir)).map((f) => [f, JSON.parse(readFileSync(f, 'utf8')).path as string]))
  for (const { code } of content.site.i18n.locales) {
    if (code === content.defaultLocale) continue
    const dir = path.join(root, CONTENT_FILES.i18nDir, code)
    const read = (f: string) => (existsSync(path.join(dir, f)) ? JSON.parse(readFileSync(path.join(dir, f), 'utf8')) : undefined)
    out.push({ locale: code, file: rel(path.join(dir, 'site.json')), missing: missingTranslations(content.site as never, read('site.json')) })
    out.push({ locale: code, file: rel(path.join(dir, 'products.json')), missing: missingTranslations(content.catalog as never, read('products.json')) })
    for (const [file, pagePath] of pageFile) {
      const page = content.pages.find((p) => p.path === pagePath)
      const name = path.join('pages', path.basename(file))
      if (page) out.push({ locale: code, file: rel(path.join(dir, name)), missing: missingTranslations(page as never, read(name)) })
    }
  }
  return out
}
