// JSON-LD builders (schema.org) + absolute URL helpers shared with <Seo>.
// No aggregateRating/review markup: Google treats it as self-serving for LocalBusiness
// and does not allow re-publishing third-party (Google) reviews as structured data.
import { catalog, images, site } from '@/content'
import type { ProductT } from '@/content/schema'

export interface Crumb {
  name: string
  /** Path without base, e.g. "/" or "/produkt/oreo" */
  path: string
}

const CONTEXT = 'https://schema.org'
const DAYS: Record<string, string> = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' }

/** Production origin + deploy base, no trailing slash (env SITE_URL wins over site.json). */
export function siteUrl(): string {
  return (import.meta.env.SITE_URL || site.url).replace(/\/$/, '')
}

/**
 * Absolute URL of a page. Every route is pre-rendered to <path>/index.html and the host
 * redirects "/produkt/oreo" → "/produkt/oreo/", so non-root pages use the trailing-slash form.
 */
export function pageUrl(path: string): string {
  const [pathname, hash] = path.split('#')
  const slashed = pathname === '' || pathname === '/' ? '/' : pathname.replace(/\/?$/, '/')
  return siteUrl() + slashed + (hash ? `#${hash}` : '')
}

/** Largest generated WebP width ≤ 1200 px */
function webpWidth(key: string): number {
  const widths = images[key]?.widths ?? []
  return widths.filter((w) => w <= 1200).at(-1) ?? widths[0]
}

/** Absolute URL of an image from the manifest: og/* keys → 1200×630 JPG, others → largest WebP ≤ 1200 px. */
export function imageUrl(key: string): string {
  if (key.startsWith('og/')) return `${siteUrl()}/images/${key}.jpg`
  return `${siteUrl()}/images/${key}-${webpWidth(key)}.webp`
}

/**
 * og:image with its size. og/* keys and transparent cut-outs → 1200×630 JPG (`npm run images` flattens
 * cut-outs onto the cream background as <key>-og.jpg), other photos → largest WebP ≤ 1200 px.
 */
export function socialImage(key: string): { url: string; width: number; height: number } {
  const img = images[key]
  if (key.startsWith('og/')) return { url: imageUrl(key), width: 1200, height: 630 }
  if (img?.alpha) return { url: `${siteUrl()}/images/${key}-og.jpg`, width: 1200, height: 630 }
  const width = webpWidth(key)
  return { url: imageUrl(key), width, height: Math.round((img.height * width) / img.width) }
}

const bakeryId = () => `${pageUrl('/')}#bakery`

export function bakeryJsonLd(): object {
  const { address, contact, links } = site
  return {
    '@context': CONTEXT,
    '@type': 'Bakery',
    '@id': bakeryId(),
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: pageUrl('/'),
    image: imageUrl(site.seo.ogImage),
    logo: `${siteUrl()}/apple-touch-icon.png`,
    telephone: contact.phone,
    ...(contact.email && { email: contact.email }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      postalCode: address.postalCode,
      addressLocality: address.city,
      addressCountry: address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: address.geo.lat, longitude: address.geo.lng },
    // Closed days are simply omitted (schema.org: no specification = closed). Special hours apply to one date
    // (validFrom = validThrough); a closed date is 00:00–00:00, as Google documents for all-day closures.
    openingHoursSpecification: [
      ...site.hours.flatMap((h) =>
        'closed' in h ? [] : [{ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days.map((d) => DAYS[d]), opens: h.opens, closes: h.closes }],
      ),
      ...site.specialHours.map((s) => ({
        '@type': 'OpeningHoursSpecification',
        opens: 'closed' in s ? '00:00' : s.opens,
        closes: 'closed' in s ? '00:00' : s.closes,
        validFrom: s.date,
        validThrough: s.date,
      })),
    ],
    ...(site.priceRange && { priceRange: site.priceRange }),
    ...(site.servesCuisine.length > 0 && { servesCuisine: site.servesCuisine }),
    sameAs: [links.instagram, links.facebook, links.googleMaps].filter(Boolean),
    hasMap: links.googleMaps,
  }
}

export function websiteJsonLd(): object {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': `${pageUrl('/')}#website`,
    url: pageUrl('/'),
    name: site.name,
    alternateName: site.legalName,
    description: site.description,
    inLanguage: 'pl-PL',
    publisher: { '@id': bakeryId() },
  }
}

/**
 * A flavour. Google requires offers, review or aggregateRating on a Product, so a Product (with its Offer)
 * is emitted only where the site publishes the price (site.catalog.showPrices); otherwise a schema.org
 * MenuItem, which Google does not validate as a rich result.
 */
export function productJsonLd(product: ProductT): object {
  const url = pageUrl(`/produkt/${product.slug}`)
  const item = {
    '@id': `${url}#product`,
    name: product.name,
    image: product.images.map((img) => imageUrl(img.src)),
    description: product.description,
    url,
  }
  if (!site.catalog.showPrices || product.price == null) return { '@context': CONTEXT, '@type': 'MenuItem', ...item }
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    ...item,
    sku: product.slug,
    brand: { '@type': 'Brand', name: site.name },
    category: catalog.categories.find((c) => c.slug === product.category)?.name ?? product.category,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
      seller: { '@type': 'Bakery', name: site.legalName, url: pageUrl('/') },
    },
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]): object {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function breadcrumbJsonLd(trail: Crumb[]): object {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, name: crumb.name, item: pageUrl(crumb.path) })),
  }
}
