/**
 * Node-only: loads every content file, validates it against the Zod schemas and
 * checks cross-references (images, product slugs, internal links, anchors).
 * Used by the Vite content plugin (dev + build), `npm run content:check`,
 * the MCP server and the AI edit CLI — so every editor hits the same rules.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { ZodType } from 'zod'
import { Catalog, LINK_TOKENS, Page, Reviews, Site, type CatalogT, type PageT, type ReviewsT, type SiteT } from './schema.ts'

export type ImageManifest = Record<string, { width: number; height: number; widths: number[]; alpha: boolean }>

export interface Content {
  site: SiteT
  catalog: CatalogT
  reviews: ReviewsT
  pages: PageT[]
  images: ImageManifest
}

export const CONTENT_FILES = {
  site: 'src/data/site.json',
  catalog: 'src/data/products.json',
  reviews: 'src/data/reviews.json',
  pagesDir: 'src/data/pages',
  images: 'src/generated/images.json',
} as const

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
  ].map((f) => path.join(root, f))
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

export function loadContent(root = process.cwd()): { content?: Content; errors: string[] } {
  const errors: string[] = []
  const rel = (f: string) => path.relative(root, f)

  const imagesFile = path.join(root, CONTENT_FILES.images)
  const images = (existsSync(imagesFile) ? readJson(imagesFile, errors) : {}) as ImageManifest

  const siteFile = path.join(root, CONTENT_FILES.site)
  const catalogFile = path.join(root, CONTENT_FILES.catalog)
  const reviewsFile = path.join(root, CONTENT_FILES.reviews)
  const site = parse(Site, readJson(siteFile, errors), rel(siteFile), errors)
  const catalog = parse(Catalog, readJson(catalogFile, errors), rel(catalogFile), errors)
  const reviews = parse(Reviews, readJson(reviewsFile, errors), rel(reviewsFile), errors)

  const pageFiles = contentFiles(root).filter((f) => f.includes(`${path.sep}pages${path.sep}`))
  const pages: { file: string; page: PageT }[] = []
  for (const file of pageFiles) {
    const page = parse(Page, readJson(file, errors), rel(file), errors)
    if (page) pages.push({ file: rel(file), page })
  }

  if (!site || !catalog || !reviews || pages.length !== pageFiles.length) return { errors }

  // ── Cross-reference checks ──────────────────────────────────────────────────
  const productSlugs = new Set(catalog.products.map((p) => p.slug))
  const categorySlugs = new Set(catalog.categories.map((c) => c.slug))
  const pagePaths = new Map<string, string>()
  for (const { file, page } of pages) {
    const norm = page.path.replace(/\/$/, '') || '/'
    if (pagePaths.has(norm)) errors.push(`${file} → path: "${page.path}" is already used by ${pagePaths.get(norm)}`)
    if (norm.startsWith('/produkt')) errors.push(`${file} → path: "/produkt…" is reserved for product pages`)
    pagePaths.set(norm, file)
  }
  if (!pagePaths.has('/')) errors.push('src/data/pages: no page with path "/" (home page)')

  const anchorsByPath = new Map<string, Set<string>>()
  for (const { page } of pages) anchorsByPath.set(page.path.replace(/\/$/, '') || '/', new Set(page.sections.map((s) => s.id)))

  const checkImage = (where: string, src: string) => {
    if (!images[src]) errors.push(`${where}: image "${src}" not found in ${CONTENT_FILES.images} (add the file to assets/images and run \`npm run images\`)`)
  }
  const checkHref = (where: string, href: string, currentPath: string) => {
    if ((LINK_TOKENS as readonly string[]).includes(href)) {
      if (href === '@facebook' && !site.links.facebook) errors.push(`${where}: "@facebook" used but site.links.facebook is empty`)
      return
    }
    if (/^(https?:|mailto:|tel:)/.test(href)) return
    const [rawPath, anchor] = href.split('#')
    const target = rawPath === '' ? currentPath : rawPath.replace(/\/$/, '') || '/'
    const product = target.match(/^\/produkt\/([^/]+)$/)
    if (product) {
      if (!productSlugs.has(product[1])) errors.push(`${where}: link "${href}" → unknown product "${product[1]}"`)
      return
    }
    if (!pagePaths.has(target)) errors.push(`${where}: link "${href}" → no page with path "${target}"`)
    else if (anchor && !anchorsByPath.get(target)?.has(anchor)) errors.push(`${where}: link "${href}" → no section with id "${anchor}" on "${target}"`)
  }
  const scan = (file: string, data: unknown, currentPath: string) => {
    for (const [p, obj] of objects(data)) {
      const where = `${file} → ${p.join('.')}`
      if (typeof obj.src === 'string' && typeof obj.alt === 'string') checkImage(where, obj.src)
      if (typeof obj.href === 'string') checkHref(where, obj.href, currentPath)
      if (p.at(-1) === 'video' && typeof obj.src === 'string' && !existsSync(path.join(root, 'public', obj.src)))
        errors.push(`${where}: video "public/${obj.src}" does not exist`)
    }
  }

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
    ['caramel', 'brandDeep', 3], // hero accent line, large
  ]
  for (const [fg, bg, min] of pairs) {
    const ratio = contrast(c[fg], c[bg])
    if (ratio < min) errors.push(`${CONTENT_FILES.site} → theme.colors: ${fg} on ${bg} has contrast ${ratio.toFixed(2)}:1, needs ≥ ${min}:1 (WCAG AA)`)
  }

  scan(CONTENT_FILES.site, site, '/')
  checkHref(`${CONTENT_FILES.site} → consent.policyHref`, site.consent.policyHref, '/')
  if (!images[site.seo.ogImage]) errors.push(`${CONTENT_FILES.site} → seo.ogImage: "${site.seo.ogImage}" not found in images`)
  scan(CONTENT_FILES.catalog, catalog, '/')
  for (const { file, page } of pages) {
    scan(file, page, page.path.replace(/\/$/, '') || '/')
    if (page.seo.ogImage && !images[page.seo.ogImage]) errors.push(`${file} → seo.ogImage: "${page.seo.ogImage}" not found in images`)
    // Exactly one <h1> per page: it comes from a hero, or from a text section with a heading placed first
    const enabled = page.sections.filter((s) => s.enabled)
    if (page.sections.filter((s) => s.type === 'hero').length > 1) errors.push(`${file} → sections: at most one "hero" section per page`)
    const first = enabled[0]
    if (first && !(first.type === 'hero' || (first.type === 'text' && first.heading)))
      errors.push(`${file} → sections: the first enabled section must be "hero" or a "text" section with a heading (it renders the page <h1>)`)
    else if (enabled.some((s, i) => i > 0 && s.type === 'hero')) errors.push(`${file} → sections: the "hero" section must be the first enabled section`)
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

  if (errors.length) return { errors }
  return { content: { site, catalog, reviews, pages: pages.map((p) => p.page), images }, errors }
}
