// JSON-LD builders (schema.org) + absolute URL helpers shared with <Seo>.
// Builders take the language version of the page (useContent()): names, descriptions and URLs are
// in that language; inLanguage is set where schema.org defines it (CreativeWork: WebSite, FAQPage, Menu).
// No aggregateRating/review markup: Google treats it as self-serving for LocalBusiness
// and does not allow re-publishing third-party (Google) reviews as structured data.
import { catalogLink } from '@/components/product/helpers'
import { contentFor, defaultLocale, images, type Localized } from '@/content'
import type { ProductT } from '@/content/schema'

export interface Crumb {
  name: string
  /** Path without base and language prefix, e.g. "/" or "/produkt/oreo" */
  path: string
}

const CONTEXT = 'https://schema.org'
const DAYS: Record<string, string> = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' }

/** Production origin + deploy base, no trailing slash (env SITE_URL wins over site.json; same in every language). */
export function siteUrl(): string {
  return (import.meta.env.SITE_URL || contentFor(defaultLocale).site.url).replace(/\/$/, '')
}

/**
 * Absolute URL of a page (pass the path with its language prefix, e.g. c.localize(path)). Every route is pre-rendered to <path>/index.html and the host
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

const homeUrl = (c: Localized) => pageUrl(c.localize('/'))

/**
 * One shop, one identifier: every language version describes the same Bakery node (@id on the default-language
 * home page), only its texts and `url` follow the page language. Per-language ids would declare four bakeries at
 * one address; a shared id lets search engines merge the descriptions into one entity (and its Google profile).
 */
const bakeryId = () => `${pageUrl('/')}#bakery`

const productUrl = (product: ProductT, c: Localized) => pageUrl(c.localize(`/produkt/${product.slug}`))

/** Offer of a flavour, only where the site shows its price (site.catalog.showPrices) */
function offerOf(product: ProductT, c: Localized): object | undefined {
  if (!c.site.catalog.showPrices || product.price == null) return undefined
  return {
    '@type': 'Offer',
    price: product.price.toFixed(2),
    priceCurrency: product.currency,
    availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: productUrl(product, c),
  }
}

/** The flavours as a menu: one MenuSection per category, a MenuItem per flavour linking to its page. */
function menuJsonLd(c: Localized): object {
  const catalog = catalogLink(c)
  return {
    '@type': 'Menu',
    '@id': `${homeUrl(c)}#menu`,
    name: catalog.label,
    url: pageUrl(c.localize(catalog.href)),
    inLanguage: c.lang,
    hasMenuSection: c.catalog.categories
      .map((category) => ({
        '@type': 'MenuSection',
        name: category.name,
        hasMenuItem: c.products
          .filter((p) => p.category === category.slug)
          .map((p) => {
            const offers = offerOf(p, c)
            return {
              '@type': 'MenuItem',
              name: p.name,
              description: p.shortDescription,
              image: imageUrl(p.images[0].src),
              url: productUrl(p, c),
              ...(offers && { offers }),
            }
          }),
      }))
      .filter((section) => section.hasMenuItem.length > 0),
  }
}

export function bakeryJsonLd(c: Localized): object {
  const { site } = c
  const { address, contact, links } = site
  return {
    '@context': CONTEXT,
    '@type': 'Bakery',
    '@id': bakeryId(),
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: homeUrl(c),
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
    areaServed: { '@type': 'City', name: address.city },
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
    // Eat in, take away or Wolt delivery — the site offers no table booking (bigger orders: phone/Instagram, see FAQ).
    // Change to true or a booking URL if the shop starts taking reservations.
    acceptsReservations: false,
    hasMenu: menuJsonLd(c),
    potentialAction: {
      '@type': 'OrderAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: links.order,
        actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
      },
    },
    sameAs: [links.instagram, links.facebook, links.googleMaps].filter(Boolean),
    hasMap: links.googleMaps,
  }
}

export function websiteJsonLd(c: Localized): object {
  const { site } = c
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': `${homeUrl(c)}#website`,
    url: homeUrl(c),
    name: site.name,
    alternateName: site.legalName,
    description: site.description,
    inLanguage: c.lang,
    publisher: { '@id': bakeryId() },
  }
}

/**
 * A flavour. Google requires offers, review or aggregateRating on a Product, so a Product (with its Offer)
 * is emitted only where the site publishes the price (site.catalog.showPrices); otherwise a schema.org
 * MenuItem, which Google does not validate as a rich result.
 */
export function productJsonLd(product: ProductT, c: Localized): object {
  const { site, catalog } = c
  const url = productUrl(product, c)
  const item = {
    '@id': `${url}#product`,
    name: product.name,
    image: product.images.map((img) => imageUrl(img.src)),
    description: product.description,
    url,
  }
  const offer = offerOf(product, c)
  if (!offer) return { '@context': CONTEXT, '@type': 'MenuItem', ...item }
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    ...item,
    sku: product.slug,
    brand: { '@type': 'Brand', name: site.name },
    category: catalog.categories.find((c) => c.slug === product.category)?.name ?? product.category,
    // Organization (Bakery's parent type) with the Bakery's @id: a full Bakery node would need address, hours… here too
    offers: { ...offer, seller: { '@type': 'Organization', '@id': bakeryId(), name: site.legalName, url: homeUrl(c) } },
  }
}

export function faqJsonLd(items: { question: string; answer: string }[], c: Localized): object {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    inLanguage: c.lang,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function breadcrumbJsonLd(trail: Crumb[], c: Localized): object {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, name: crumb.name, item: pageUrl(c.localize(crumb.path)) })),
  }
}
