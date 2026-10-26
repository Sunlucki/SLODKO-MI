// Post-build steps for the static export (runs after `vite-react-ssg build`, respects OUT_DIR):
// tidy <head>, a 404 page per language (404.html, <lang>/404.html), sitemap.xml (with hreflang alternates),
// robots.txt, llms.txt and an SEO sanity check of every page: title/description present (length warnings),
// unique titles per language, one <h1>, JSON-LD (parses, required properties, links into the build),
// social meta, its language (<html lang>, hreflang reciprocity, internal links) and every sitemap URL.
//
//   npm run build   (or: OUT_DIR=.tmp/x npx vite-react-ssg build && OUT_DIR=.tmp/x npx tsx scripts/postbuild.ts)
//
// Env (shell or .env / .env.local, like vite.config.ts): SITE_URL, VITE_BASE, NOINDEX=1 (preview build).
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadEnv } from 'vite'
import { loadContent } from '../src/content/validate.ts'
import { deferAppScript } from './lib/defer-app-script.ts'

const out = path.resolve(process.env.OUT_DIR || 'dist')
const { content, errors: contentErrors } = loadContent()
if (!content) {
  console.error(`✗ postbuild: content is invalid:\n  • ${contentErrors.join('\n  • ')}`)
  process.exit(1)
}
const { site, catalog, reviews, pages } = content
const { locales, defaultLocale } = site.i18n
const defaultLang = locales.find((l) => l.code === defaultLocale)!

const env = loadEnv('production', process.cwd(), '')
// Same rules as siteUrl()/pageUrl() in src/lib/schema-org.ts (that module needs the Vite virtual content)
const base = (env.SITE_URL || site.url).replace(/\/$/, '')
const urlOf = (route: string) => base + (route === '/' ? '/' : `${route.replace(/\/$/, '')}/`)
// Preview build (GitHub Pages): every page is noindex and there is no sitemap, so it never competes
// with the production site; its canonical URLs may then point at production on purpose.
const preview = env.NOINDEX === '1'

const errors: string[] = []
const warnings: string[] = []

// Canonical, og:url, JSON-LD, sitemap and robots.txt all use `base`, so its path must be the folder the
// build is served from — otherwise production pages would name another site (e.g. the preview) canonical.
const deployBase = env.VITE_BASE || '/'
if (!preview && new URL(base).pathname.replace(/\/$/, '') !== deployBase.replace(/\/$/, '')) {
  if (env.SITE_URL) {
    console.error(`✗ postbuild: SITE_URL ${base} does not match VITE_BASE "${deployBase}" — fix one of them`)
    process.exit(1)
  }
  warnings.push(
    `SITE_URL is not set, so canonical URLs, sitemap and og:url use site.json url ${base}, which does not match VITE_BASE "${deployBase}". ` +
      'Fine for a local check — set SITE_URL (environment or .env.local) before deploying this build.',
  )
}

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

/** Language of a route by its prefix ("/en/produkt/oreo" → en), as localeFromPath() in src/content/index.ts */
function localeOf(route: string): (typeof locales)[number] {
  const first = route.split('/')[1]
  return locales.find((l) => l.code === first && l.code !== defaultLocale) ?? defaultLang
}

/** Value of an attribute in an HTML tag (React/Helmet may write hrefLang or hreflang) */
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1]

/**
 * Route of an internal page link ("/SLODKO-MI/en/produkt/oreo/#x" → "/en/produkt/oreo/"), or null for
 * external links, in-page anchors and files (images, PDFs…).
 */
function linkRoute(href: string): string | null {
  const basePath = deployBase.replace(/\/?$/, '/')
  const pathname = href.split(/[?#]/)[0]
  const rest = pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1) : pathname.startsWith(basePath) ? pathname.slice(basePath.length) : null
  if (rest === null || /\.[a-z0-9]+$/i.test(rest)) return null
  return `/${rest}`
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

/** Makes a page noindex: replaces the robots meta of indexable pages (max-image-preview) or adds one. */
const withNoindex = (html: string) =>
  /<meta[^>]*name="robots"[^>]*noindex/.test(html)
    ? html
    : /<meta[^>]*name="robots"/.test(html)
      ? html.replace(/(<meta[^>]*name="robots"[^>]*content=")[^"]*/, '$1noindex,follow')
      : html.replace(/<\/head>/, '<meta name="robots" content="noindex,follow"></head>')

for (const file of htmlFiles(out)) {
  const html = readFileSync(file, 'utf8')
  const tidy = preview ? withNoindex(tidyHead(html)) : tidyHead(html)
  if (tidy !== html) writeFileSync(file, tidy)
}

// Build metadata (manifest.json, ssr-manifest.json) must not be deployed
rmSync(path.join(out, '.vite'), { recursive: true, force: true })

// ── 2. 404.html per language ─────────────────────────────────────────────────────
// /404.html (default language; GitHub Pages serves it for every missing URL) and /<lang>/404.html, which
// public/.htaccess (ErrorDocument) serves for missing URLs under /<lang>/.
const prefixOf = (code: string) => (code === defaultLocale ? '' : `${code}/`)
for (const { code } of locales) {
  const dir = path.join(out, `${prefixOf(code)}404`)
  if (existsSync(path.join(dir, 'index.html'))) {
    writeFileSync(path.join(out, `${prefixOf(code)}404.html`), withNoindex(readFileSync(path.join(dir, 'index.html'), 'utf8')))
    // Only the real 404 response remains — no indexable-looking /404/ page with status 200
    rmSync(dir, { recursive: true })
  } else if (!existsSync(path.join(out, `${prefixOf(code)}404.html`))) {
    errors.push(`${prefixOf(code)}404/index.html not found — ${prefixOf(code)}404.html was not written (route "${prefixOf(code)}404" in src/routes.tsx)`)
  }
}

// Apache picks the 404 page by the ErrorDocument lines of .htaccess, which carry the deploy base (subfolder deploys)
const htaccess = existsSync(path.join(out, '.htaccess')) ? readFileSync(path.join(out, '.htaccess'), 'utf8') : ''
if (!preview)
  for (const { code } of locales) {
    const doc = `ErrorDocument 404 ${deployBase.replace(/\/?$/, '/')}${prefixOf(code)}404.html`
    if (!htaccess.includes(doc)) warnings.push(`.htaccess has no "${doc}" — missing URLs${code === defaultLocale ? '' : ` under /${code}/`} would not get the ${code} 404 page (see public/.htaccess)`)
  }

// ── 3. SEO sanity check ──────────────────────────────────────────────────────────
const indexable: string[] = []
/** Indexable page URL → its hreflang alternates (hreflang → URL) and its own language */
const alternates = new Map<string, { lang: string; links: Map<string, string> }>()
/** Language → <title> → files using it (indexable pages) */
const titles = new Map<string, Map<string, string[]>>()

/** Text of an HTML attribute or element (React escapes &, <, >, " and ') */
const decode = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (_, e: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#x27': "'", '#39': "'" })[e]!)
/** Length as people count it (code points, so "ł" or "ц" is one character) */
const chars = (s: string) => [...s].length
const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

/** Build file of a URL of this site (`base` + path), or null for other sites */
function fileOfUrl(url: string): string | null {
  if (!url.startsWith(`${base}/`)) return null
  const rest = decodeURI(url.slice(base.length + 1).split(/[?#]/)[0])
  if (rest === '' || rest.endsWith('/')) return `${rest}index.html`
  return /\.[a-z0-9]+$/i.test(rest) ? rest : `${rest}/index.html`
}

/** schema.org properties a node of each type must have (Google's required + what this site always outputs) */
const REQUIRED: Record<string, string[]> = {
  Bakery: ['@id', 'name', 'url', 'image', 'telephone', 'address', 'geo', 'openingHoursSpecification', 'hasMenu'],
  PostalAddress: ['streetAddress', 'addressLocality', 'postalCode', 'addressCountry'],
  GeoCoordinates: ['latitude', 'longitude'],
  OpeningHoursSpecification: ['opens', 'closes'],
  WebSite: ['@id', 'name', 'url', 'inLanguage'],
  Menu: ['hasMenuSection'],
  MenuSection: ['name', 'hasMenuItem'],
  MenuItem: ['name', 'url'],
  Product: ['name', 'image', 'offers'],
  Offer: ['price', 'priceCurrency', 'availability'],
  OrderAction: ['target'],
  EntryPoint: ['urlTemplate'],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position', 'name', 'item'],
}
/** Properties whose URL values must exist in the build when they point at this site */
const URL_KEYS = new Set(['@id', 'url', 'item', 'image', 'logo'])

/** Problems of one JSON-LD block: missing required properties, review markup, links to pages not in the build */
function jsonLdProblems(data: unknown): string[] {
  const problems: string[] = []
  const root = data as Record<string, unknown>
  if (root?.['@context'] !== 'https://schema.org') problems.push('"@context" is not "https://schema.org"')
  const walk = (node: unknown, where: string) => {
    if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${where}[${i}]`))
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    const type = obj['@type']
    const isRef = Object.keys(obj).length === 1 && '@id' in obj
    if (!type && !isRef && where) problems.push(`${where}: object without "@type"`)
    for (const key of typeof type === 'string' ? (REQUIRED[type] ?? []) : []) {
      const v = obj[key]
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) problems.push(`${where || type}: ${type} without "${key}"`)
    }
    for (const [key, value] of Object.entries(obj)) {
      // Google: self-serving reviews of a LocalBusiness and re-published Google reviews are not allowed
      if (key === 'aggregateRating' || key === 'review') problems.push(`${where || type}: "${key}" markup is not allowed (see src/lib/schema-org.ts)`)
      for (const url of URL_KEYS.has(key) ? [value].flat() : []) {
        const file = typeof url === 'string' ? fileOfUrl(url) : null
        if (file && !existsSync(path.join(out, file))) problems.push(`${where || type}.${key}: ${url} is not in the build`)
      }
      walk(value, where ? `${where}.${key}` : key)
    }
  }
  walk(data, '')
  return problems
}

for (const file of htmlFiles(out).sort()) {
  const rel = path.relative(out, file).split(path.sep).join('/')
  const html = readFileSync(file, 'utf8')
  const route = routeOf(file)
  const noindex = /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html)
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1]
  const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)?.[1]
  const h1 = html.match(/<h1[\s>]/g)?.length ?? 0
  const title = decode(html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? '').trim()
  const description = decode(html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ?? '').trim()

  if (!title) errors.push(`${rel}: missing <title>`)
  else if (chars(title) > TITLE_MAX) warnings.push(`${rel}: <title> has ${chars(title)} characters (max ${TITLE_MAX} incl. "${site.seo.titleTemplate.replace('%s', '')}"): ${title}`)
  if (!description) errors.push(`${rel}: missing meta description`)
  else if (chars(description) > DESCRIPTION_MAX) warnings.push(`${rel}: meta description has ${chars(description)} characters (max ${DESCRIPTION_MAX})`)
  // Every language version is a separate page: its <html lang> and internal links must stay in its language
  // (<lang>/404.html is the 404 of that language). Language switcher links carry hreflang/lang and are exempt.
  const locale = localeOf(`/${rel}`)
  const lang = html.match(/<html[^>]*\slang="([^"]*)"/i)?.[1]
  if (lang !== locale.htmlLang) errors.push(`${rel}: <html lang="${lang ?? ''}"> — expected "${locale.htmlLang}" for this URL`)
  const strays = new Set<string>()
  for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(tag, 'href')
    const target = href && linkRoute(href)
    if (target && !attr(tag, 'hreflang') && !attr(tag, 'lang') && localeOf(target).code !== locale.code) strays.add(href)
  }
  if (strays.size)
    errors.push(`${rel}: links to another language version (${[...strays].join(', ')}) — internal links must keep the "${locale.code}" prefix`)
  if (h1 !== 1) errors.push(`${rel}: ${h1} <h1> elements (expected exactly 1)`)
  for (const [, json] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let data: unknown
    try {
      data = JSON.parse(json)
    } catch {
      errors.push(`${rel}: invalid JSON-LD`)
      continue
    }
    for (const problem of jsonLdProblems(data)) errors.push(`${rel}: JSON-LD ${problem}`)
  }
  if (ogImage?.startsWith(`${base}/`) && !existsSync(path.join(out, decodeURI(ogImage.slice(base.length + 1)))))
    warnings.push(`${rel}: og:image ${ogImage} is not in the build (run npm run images)`)
  if (noindex || !route) continue
  if (!canonical) warnings.push(`${rel}: missing <link rel="canonical">`)
  else if (canonical !== urlOf(route)) warnings.push(`${rel}: canonical ${canonical} ≠ expected ${urlOf(route)}`)
  // Social previews and image search (src/components/Seo.tsx)
  const metas = ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']
  const missingMeta = metas.filter((m) => !new RegExp(`<meta[^>]*(?:property|name)="${m}"[^>]*content="[^"]+"`).test(html))
  if (missingMeta.length) warnings.push(`${rel}: missing ${missingMeta.join(', ')}`)
  if (!/<meta[^>]*name="robots"[^>]*content="[^"]*max-image-preview:large/.test(html)) warnings.push(`${rel}: no robots max-image-preview:large`)
  const byTitle = titles.get(locale.code) ?? new Map<string, string[]>()
  byTitle.set(title, [...(byTitle.get(title) ?? []), rel])
  titles.set(locale.code, byTitle)
  const links = new Map<string, string>()
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const hreflang = attr(tag, 'hreflang')
    const href = attr(tag, 'href')
    if (attr(tag, 'rel') === 'alternate' && hreflang && href) links.set(hreflang, href)
  }
  alternates.set(urlOf(route), { lang: locale.htmlLang, links })
  indexable.push(route)
}

// hreflang: each indexable page lists every language version (itself included) and x-default (= the default
// language), and every version it names is an indexable page of this build that names it back
const expectedLangs = [...locales.map((l) => l.htmlLang), 'x-default']
for (const [url, { lang, links }] of alternates) {
  const missing = expectedLangs.filter((l) => !links.has(l))
  if (missing.length) errors.push(`${url}: no hreflang alternate for ${missing.join(', ')}`)
  if (links.has(lang) && links.get(lang) !== url) errors.push(`${url}: hreflang="${lang}" points to ${links.get(lang)} instead of the page itself`)
  if (links.has('x-default') && links.get('x-default') !== links.get(defaultLang.htmlLang))
    errors.push(`${url}: hreflang="x-default" must point to the "${defaultLang.htmlLang}" version`)
  for (const [l, href] of links) {
    if (l === 'x-default') continue
    const target = alternates.get(href)
    if (!target) errors.push(`${url}: hreflang="${l}" → ${href} is not an indexable page of this build`)
    else if (target.lang !== l) errors.push(`${url}: hreflang="${l}" → ${href}, which is the "${target.lang}" version`)
    else if (target.links.get(lang) !== url) errors.push(`${url}: hreflang="${l}" → ${href}, which does not link back with hreflang="${lang}"`)
  }
}

// Each indexable page of a language needs its own <title> (search results and tabs tell them apart by it)
for (const [code, byTitle] of titles)
  for (const [title, files] of byTitle)
    if (files.length > 1) errors.push(`${files.join(', ')}: same <title> "${title}" in "${code}" — give each page its own seo.title`)

// The privacy policy must identify the data controller (GDPR art. 13): full business name, NIP/REGON
const policy = pages.find((p) => p.path.replace(/\/$/, '') === site.consent.policyHref.replace(/\/$/, ''))
if (policy && !/\bNIP\b/.test(JSON.stringify(policy.sections.filter((s) => s.enabled))))
  warnings.push(`${policy.path}: the privacy policy names no NIP — add the controller's full business name and NIP/REGON (ask the owner)`)

// ── 4. sitemap.xml + robots.txt ──────────────────────────────────────────────────
// No <lastmod>: the build date would mark every URL as changed on each weekly reviews redeploy.
// Every language version is listed with the same hreflang alternates as in its <head> (checked above).
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...indexable.flatMap((route) => [
    `  <url><loc>${urlOf(route)}</loc>`,
    ...[...(alternates.get(urlOf(route))?.links ?? [])].map(([l, href]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`),
    '  </url>',
  ]),
  '</urlset>',
  '',
].join('\n')
// Every URL the sitemap names (<loc> and alternates) must be an indexable page of this build
const indexableUrls = new Set(indexable.map(urlOf))
for (const [, url] of sitemap.matchAll(/(?:<loc>|href=")([^<"]+)/g)) {
  const file = fileOfUrl(url)
  if (!file || !existsSync(path.join(out, file))) errors.push(`sitemap.xml: ${url} is not in the build`)
  else if (!indexableUrls.has(url)) errors.push(`sitemap.xml: ${url} is not an indexable page (noindex, or not its canonical URL)`)
}
if (!preview) writeFileSync(path.join(out, 'sitemap.xml'), sitemap)
writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n${preview ? '' : `\nSitemap: ${base}/sitemap.xml\n`}`)

// ── 5. llms.txt — plain-Markdown business summary for AI search engines (llmstxt.org) ──
// Short day names of the default language (site.json → ui.days, Polish defaults in schema.ts)
const DAY_SHORT: Record<string, string> = site.ui.days.short
const DAY_ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

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
// Upcoming special hours only (the JSON-LD keeps past ones, they expire through validThrough)
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date()) // YYYY-MM-DD
const specialHours = site.specialHours
  .filter((s) => s.date >= today)
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((s) => {
    const day = DAY_SHORT[DAY_ORDER[(new Date(`${s.date}T12:00:00Z`).getUTCDay() + 6) % 7]]
    const time = 'closed' in s ? 'nieczynne' : `${s.opens}–${s.closes}`
    return `${s.date.split('-').reverse().join('.')} (${day}) ${time}${s.note ? ` — ${s.note}` : ''}`
  })
  .join('; ')
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
  ...(specialHours ? [`- Godziny specjalne: ${specialHours}`] : []),
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
  // The same site in the other languages (Polish above stays the primary version): home page + flavour pages
  ...locales
    .filter((l) => l.code !== defaultLocale)
    .flatMap((l) => {
      const c = content.locales[l.code]
      if (!c) return []
      const home = c.pages.find((p) => p.path === '/')
      const prefix = `/${l.code}`
      return [
        `## ${l.label} (${l.htmlLang})`,
        '',
        `- [${home?.seo.title ?? l.label}](${urlOf(prefix)})${home ? `: ${home.seo.description}` : ''}`,
        ...c.catalog.products.map((p) => `- [${p.name}](${urlOf(`${prefix}/produkt/${p.slug}`)})`),
        '',
      ]
    }),
].join('\n')
writeFileSync(path.join(out, 'llms.txt'), llms)

// ── Report ───────────────────────────────────────────────────────────────────────
const relOut = path.relative(process.cwd(), out) || '.'
console.log(
  preview
    ? `✓ postbuild: ${relOut} preview build — all pages noindex, no sitemap; robots.txt, llms.txt, 404 pages (${locales.length} languages) — base ${base}`
    : `✓ postbuild: ${relOut}/sitemap.xml (${indexable.length} URLs), robots.txt, llms.txt, 404 pages (${locales.length} languages) — base ${base}`,
)
if (warnings.length) console.warn(`⚠ postbuild: ${warnings.length} warning(s):\n  • ${warnings.join('\n  • ')}`)
if (errors.length) {
  console.error(`✗ postbuild: ${errors.length} error(s):\n  • ${errors.join('\n  • ')}`)
  process.exit(1)
}
