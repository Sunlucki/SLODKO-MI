// Post-build steps for the static export (runs after `vite-react-ssg build`, respects OUT_DIR):
// tidy <head>, 404.html, sitemap.xml, robots.txt, llms.txt and an SEO sanity check of every page.
//
//   npm run build   (or: OUT_DIR=.tmp/x npx vite-react-ssg build && OUT_DIR=.tmp/x npx tsx scripts/postbuild.ts)
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadContent } from '../src/content/validate.ts'
import { deferAppScript } from './lib/defer-app-script.ts'

const out = path.resolve(process.env.OUT_DIR || 'dist')
const { content, errors: contentErrors } = loadContent()
if (!content) {
  console.error(`✗ postbuild: content is invalid:\n  • ${contentErrors.join('\n  • ')}`)
  process.exit(1)
}
const { site, catalog, reviews, pages } = content

// Same rules as siteUrl()/pageUrl() in src/lib/schema-org.ts (that module needs the Vite virtual content)
const base = (process.env.SITE_URL || site.url).replace(/\/$/, '')
const urlOf = (route: string) => base + (route === '/' ? '/' : `${route.replace(/\/$/, '')}/`)
const today = new Date().toISOString().slice(0, 10)

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return htmlFiles(full)
    return e.name.endsWith('.html') ? [full] : []
  })
}

/** "produkt/oreo/index.html" → "/produkt/oreo"; non-index files (404.html) are not routes. */
function routeOf(file: string): string | null {
  const rel = path.relative(out, file).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  return rel.endsWith('/index.html') ? `/${rel.slice(0, -'/index.html'.length)}` : null
}

// ── 1. Tidy every page's <head> ──────────────────────────────────────────────────
// vite-react-ssg adds <link rel=preload as=font> for EVERY font file (all Manrope subsets,
// .woff fallbacks). Keep only the Anton preloads that Layout adds through <Head> (data-rh).
// Helmet tags are injected before <meta charset>; move it first (must be in the first 1024 bytes).
function tidyHead(html: string): string {
  html = html.replace(/<link\b[^>]*>/g, (tag) => (/\brel="preload"/.test(tag) && /\bas="font"/.test(tag) && !/\bdata-rh\b/.test(tag) ? '' : tag))
  const charset = html.match(/<meta charset="[^"]*">/i)?.[0]
  if (charset) html = html.replace(charset, '').replace(/<head[^>]*>/, (head) => head + charset)
  return deferAppScript(html)
}


for (const file of htmlFiles(out)) {
  const html = readFileSync(file, 'utf8')
  const tidy = tidyHead(html)
  if (tidy !== html) writeFileSync(file, tidy)
}

// Build metadata (manifest.json, ssr-manifest.json) must not be deployed
rmSync(path.join(out, '.vite'), { recursive: true, force: true })

// ── 2. 404.html (Apache ErrorDocument + GitHub Pages pick it up automatically) ──
const notFoundDir = path.join(out, '404')
if (existsSync(path.join(notFoundDir, 'index.html'))) {
  let html = readFileSync(path.join(notFoundDir, 'index.html'), 'utf8')
  if (!/<meta[^>]*name="robots"[^>]*noindex/.test(html)) html = html.replace(/<\/head>/, '<meta name="robots" content="noindex,follow"></head>')
  writeFileSync(path.join(out, '404.html'), html)
  // Only the real 404 response remains — no indexable-looking /404/ page with status 200
  rmSync(notFoundDir, { recursive: true })
} else {
  console.warn('⚠ postbuild: 404/index.html not found — 404.html was not written')
}

// ── 3. SEO sanity check ──────────────────────────────────────────────────────────
const errors: string[] = []
const warnings: string[] = []
const indexable: string[] = []

for (const file of htmlFiles(out).sort()) {
  const rel = path.relative(out, file)
  const html = readFileSync(file, 'utf8')
  const route = routeOf(file)
  const noindex = /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html)
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1]
  const h1 = html.match(/<h1[\s>]/g)?.length ?? 0

  if (!/<title[^>]*>[^<]+<\/title>/.test(html)) errors.push(`${rel}: missing <title>`)
  if (!/<meta[^>]*name="description"[^>]*content="[^"]+"/.test(html)) errors.push(`${rel}: missing meta description`)
  if (!/<html[^>]*\blang="pl"/.test(html)) warnings.push(`${rel}: <html> has no lang="pl"`)
  if (h1 !== 1) warnings.push(`${rel}: ${h1} <h1> elements (expected exactly 1)`)
  for (const [, json] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(json)
    } catch {
      errors.push(`${rel}: invalid JSON-LD`)
    }
  }
  if (noindex || !route) continue
  if (!canonical) warnings.push(`${rel}: missing <link rel="canonical">`)
  else if (canonical !== urlOf(route)) warnings.push(`${rel}: canonical ${canonical} ≠ expected ${urlOf(route)}`)
  indexable.push(route)
}

// ── 4. sitemap.xml + robots.txt ──────────────────────────────────────────────────
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...indexable.map((route) => `  <url><loc>${urlOf(route)}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n')
writeFileSync(path.join(out, 'sitemap.xml'), sitemap)
writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`)

// ── 5. llms.txt — plain-Markdown business summary for AI search engines (llmstxt.org) ──
// Polish short day names, as DAY_SHORT in src/content/index.ts (not importable from Node)
const DAY_SHORT: Record<string, string> = { Mo: 'pon', Tu: 'wt', We: 'śr', Th: 'czw', Fr: 'pt', Sa: 'sob', Su: 'nd' }
const DAY_ORDER = Object.keys(DAY_SHORT)

function dayRange(days: string[]): string {
  const idx = days.map((d) => DAY_ORDER.indexOf(d))
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  return consecutive && days.length > 2 ? `${DAY_SHORT[days[0]]}–${DAY_SHORT[days[days.length - 1]]}` : days.map((d) => DAY_SHORT[d]).join(', ')
}

const pluralPl = (n: number, one: string, few: string, many: string) => {
  const rule = new Intl.PluralRules('pl-PL').select(n)
  return rule === 'one' ? one : rule === 'few' ? few : many
}

const { address, contact, links } = site
const hours = site.hours.map((h) => `${dayRange(h.days)} ${'closed' in h ? 'nieczynne' : `${h.opens}–${h.closes}`}`).join('; ')
const price = (p: (typeof catalog.products)[number]) =>
  site.catalog.showPrices && p.price != null ? ` Cena: ${p.price.toFixed(2).replace('.', ',')} zł.` : ''

const llms = [
  `# ${site.name}`,
  '',
  `> ${site.description}`,
  '',
  `${site.legalName} — ${site.tagline}. Ocena w Google: ${reviews.rating.toLocaleString('pl-PL')}/5 (${reviews.count} ${pluralPl(reviews.count, 'opinia', 'opinie', 'opinii')}).`,
  '',
  '## Kontakt i dojazd',
  '',
  `- Adres: ${address.street}, ${address.postalCode} ${address.city} (${address.district}). ${address.entranceNote.replace(/\.$/, '')}.`,
  `- Telefon: ${contact.phoneDisplay} (${contact.phone})`,
  ...(contact.email ? [`- E-mail: ${contact.email}`] : []),
  `- Godziny otwarcia: ${hours}${site.hoursNote ? `. ${site.hoursNote}` : ''}`,
  ...(site.servesCuisine.length ? [`- Oferta: ${site.servesCuisine.join(', ')}`] : []),
  ...(site.priceRange ? [`- Ceny: ${site.priceRange}`] : []),
  `- [Mapa Google](${links.googleMaps})`,
  `- [Wyznacz trasę](${links.directions})`,
  '',
  '## Zamówienia i social media',
  '',
  `- [Zamów z dostawą (Wolt)](${links.order})`,
  `- [Instagram](${links.instagram})`,
  ...(links.facebook ? [`- [Facebook](${links.facebook})`] : []),
  `- [Opinie w Google](${links.reviews})`,
  '',
  `## Smaki (${catalog.products.length})`,
  '',
  ...catalog.products.map(
    (p) =>
      `- [${p.name}](${urlOf(`/produkt/${p.slug}`)}): ${p.shortDescription}` +
      (p.allergens.length ? ` Alergeny: ${p.allergens.join(', ')}.` : '') +
      price(p) +
      (p.available ? '' : ' Chwilowo niedostępna.'),
  ),
  '',
  '## Strony',
  '',
  ...pages.filter((p) => !p.seo.noindex).map((p) => `- [${p.seo.title}](${urlOf(p.path)}): ${p.seo.description}`),
  '',
].join('\n')
writeFileSync(path.join(out, 'llms.txt'), llms)

// ── Report ───────────────────────────────────────────────────────────────────────
const relOut = path.relative(process.cwd(), out) || '.'
console.log(`✓ postbuild: ${relOut}/sitemap.xml (${indexable.length} URLs), robots.txt, llms.txt, 404.html — base ${base}`)
if (warnings.length) console.warn(`⚠ postbuild: ${warnings.length} warning(s):\n  • ${warnings.join('\n  • ')}`)
if (errors.length) {
  console.error(`✗ postbuild: ${errors.length} error(s):\n  • ${errors.join('\n  • ')}`)
  process.exit(1)
}
