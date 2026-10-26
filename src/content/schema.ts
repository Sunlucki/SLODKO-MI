/**
 * Single source of truth for ALL editable content and page structure.
 *
 * Every JSON file in src/data is validated against these schemas at build time
 * (scripts/validate-content.ts) — invalid content = failed build. The same schemas
 * are exported as JSON Schema to /schema (npm run content:schema) so any LLM or
 * editor can read the contract. Descriptions are written for LLM editors.
 */
import { z } from 'zod'

const text = z.string().trim().min(1)

// ── Links ──────────────────────────────────────────────────────────────────────

/**
 * Link targets. Besides normal paths/URLs, "@tokens" resolve from site.json so
 * content never duplicates phone numbers or URLs and tracking is attached automatically.
 */
export const LINK_TOKENS = ['@order', '@phone', '@directions', '@instagram', '@facebook', '@reviews', '@writeReview'] as const

export const Href = z
  .string()
  .trim()
  .min(1)
  .refine(
    (v) => (LINK_TOKENS as readonly string[]).includes(v) || v.startsWith('/') || v.startsWith('#') || /^(https?:|mailto:|tel:)/.test(v),
    { message: `Must be an internal path ("/…", "#…"), an absolute URL, or one of: ${LINK_TOKENS.join(', ')}` },
  )
  .describe(
    'Link target. Internal path ("/produkt/oreo", "/#smaki"), absolute URL, or a token resolved from site.json: ' +
      '@order (Wolt), @phone, @directions (Google Maps route), @instagram, @facebook, @reviews (Google reviews), @writeReview. ' +
      'Prefer tokens — they are tracked automatically (Meta Pixel + GA4). A bare "#id" only links within the same page file; ' +
      'site.json and products.json render on many pages, so they must use "/#id". The target section must exist and be enabled.',
  )

export const Cta = z
  .strictObject({
    label: text.describe('Button text (Polish, short, uppercase is styled automatically)'),
    href: Href,
    variant: z.enum(['primary', 'secondary', 'light']).default('primary').describe('primary = filled brand, secondary = outline, light = cream fill (for dark backgrounds)'),
  })
  .describe('Call-to-action button')

// ── Images ─────────────────────────────────────────────────────────────────────

export const Image = z
  .strictObject({
    src: text.describe(
      'Image key = path inside public/images WITHOUT size suffix and extension, e.g. "products/oreo" or "photos/zespol". ' +
        'Must exist in src/generated/images.json (run `npm run images` after adding a file to assets/images).',
    ),
    alt: text.describe('Polish alt text describing the image (accessibility + SEO)'),
    aiGenerated: z
      .boolean()
      .default(false)
      .describe('true = AI-generated illustration, not a real photo of the product/place; it is shown with a visible "Ilustracja" label'),
  })
  .describe('Responsive image (WebP, 480/720/960/1600 px variants generated automatically)')

export const Video = z
  .strictObject({
    src: text.describe('Path inside public/, e.g. "video/przekroj.mp4" (muted, looped, autoplay when visible)'),
    poster: Image,
  })
  .describe('Short muted background video with an image poster')

// ── Shared section fields ──────────────────────────────────────────────────────

export const Tone = z
  .enum(['cream', 'blush', 'brand', 'ink', 'caramel'])
  .describe('Colour scheme of a block: cream (light), blush (soft pink), brand (raspberry, light text), ink (chocolate, light text), caramel (warm yellow)')

const sectionBase = {
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes only')
    .describe('Unique id within the page; also used as the #anchor for navigation links'),
  enabled: z.boolean().default(true).describe('false hides the section without deleting it'),
}

const Sticker = text.max(32).describe('Small tilted tag next to a heading (like a sticker), e.g. "PROSTO Z PIECA"')

const HeadlineLine = z.strictObject({
  text,
  accent: z.boolean().default(false).describe('true = highlighted colour'),
})

// ── Section types ──────────────────────────────────────────────────────────────

export const HeroSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('hero'),
    headline: z.array(HeadlineLine).min(1).max(4).describe('Huge display headline, one entry per line'),
    description: text.optional().describe('Short supporting sentence under the headline'),
    image: Image.describe('Main hero image — ideally a cut-out PNG/WebP with transparent background'),
    note: z
      .strictObject({ title: text, subtitle: z.string().optional() })
      .optional()
      .describe('Small annotation top-right with a hand-drawn arrow pointing at the image'),
    aside: z.string().optional().describe('Short paragraph on the right side of the hero'),
    primaryCta: Cta,
    secondaryCta: Cta.optional().describe('Rendered as a round icon button next to the primary one'),
    spotlight: z
      .strictObject({
        label: text.describe('Caption above the mini card, e.g. "Bestseller"'),
        productSlugs: z.array(z.string()).min(1).describe('Slugs from products.json shown in the mini carousel (bottom-right)'),
      })
      .optional(),
    ticker: z.array(text).default([]).describe('Phrases scrolling in the marquee strip at the bottom of the hero'),
  })
  .describe('Top hero block in a rounded frame')

export const AboutSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('about'),
    tone: Tone.default('cream'),
    heading: text,
    sticker: Sticker.optional(),
    body: z.array(text).min(1).describe('Paragraphs'),
    images: z.array(Image).max(2).default([]).describe('Up to two small floating photos on the left and right'),
    cta: Cta.optional(),
  })
  .describe('Centered statement: big heading, paragraph(s), CTA, floating photos')

export const SplitSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('split'),
    left: z.strictObject({
      title: z.array(text).min(1).max(3).describe('Big white words over the photo/video, one per line'),
      image: Image,
      video: Video.optional().describe('If set, plays instead of the image'),
    }),
    right: z.strictObject({
      tone: Tone.default('caramel'),
      heading: text,
      image: Image.describe('Cut-out product image'),
      caption: text,
      cta: Cta.optional(),
    }),
  })
  .describe('Two-column block: full-bleed photo/video with big words + coloured panel with product')

export const ProductGridSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('productGrid'),
    tone: Tone.default('cream'),
    heading: text,
    sticker: Sticker.optional(),
    intro: z.string().optional(),
    source: z
      .discriminatedUnion('mode', [
        z.strictObject({ mode: z.literal('all') }),
        z.strictObject({ mode: z.literal('featured') }),
        z.strictObject({ mode: z.literal('category'), category: text }),
        z.strictObject({ mode: z.literal('manual'), slugs: z.array(text).min(1) }),
      ])
      .default({ mode: 'all' })
      .describe('Which products to show'),
    limit: z.number().int().positive().optional(),
    cta: Cta.optional(),
  })
  .describe('Grid of product cards from products.json')

export const ReviewsSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('reviews'),
    tone: Tone.default('cream'),
    heading: text,
    sticker: Sticker.optional(),
    backgroundImage: Image,
    maxItems: z.number().int().min(1).max(10).default(5),
    minRating: z.number().int().min(1).max(5).default(4).describe('Hide reviews below this star rating'),
    readAllLabel: text.default('Wszystkie opinie w Google'),
    writeLabel: text.default('Napisz opinię').describe('Shown only when site.links.writeReview is set'),
    notice: text
      .default('Opinie pochodzą z Map Google. Pokazujemy wybrane opinie z oceną 4–5 gwiazdek. Nie weryfikujemy, czy ich autorzy kupili nasze produkty.')
      .describe('Required information on where reviews come from and whether they are verified (EU Omnibus directive)'),
  })
  .describe('Google reviews carousel (data from reviews.json, refreshed by npm run reviews:fetch)')

export const VisitSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('visit'),
    tone: Tone.default('blush'),
    heading: text,
    sticker: Sticker.optional(),
    intro: z.string().optional(),
    image: Image.optional().describe('Photo of the place / team'),
    showMap: z.boolean().default(true).describe('Google Map loads only after a click (privacy + speed)'),
    ctas: z
      .array(Cta)
      .max(4)
      .default([
        { label: 'Wyznacz trasę', href: '@directions', variant: 'primary' },
        { label: 'Zadzwoń', href: '@phone', variant: 'secondary' },
        { label: 'Zamów na Wolt', href: '@order', variant: 'secondary' },
      ])
      .describe('Buttons under the address/hours card'),
  })
  .describe('Address, entrance hint, opening hours, phone, map and route button (data from site.json)')

export const GallerySection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('gallery'),
    tone: Tone.default('cream'),
    heading: text,
    sticker: Sticker.optional(),
    intro: z.string().optional(),
    images: z.array(Image).min(3).max(8),
    cta: Cta.optional(),
  })
  .describe('Photo collage / Instagram teaser')

export const FaqSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('faq'),
    tone: Tone.default('cream'),
    heading: text,
    sticker: Sticker.optional(),
    items: z.array(z.strictObject({ question: text, answer: text })).min(1),
  })
  .describe('Questions & answers (also emitted as FAQPage structured data)')

export const CtaSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('cta'),
    tone: Tone.default('brand'),
    heading: text,
    text: z.string().optional(),
    primaryCta: Cta,
    secondaryCta: Cta.optional(),
    image: Image.optional(),
    marquee: z.string().optional().describe('Text of the decorative curved band; omit to use site.tagline, "" hides the band'),
  })
  .describe('Bold banner with heading and buttons')

export const TextSection = z
  .strictObject({
    ...sectionBase,
    type: z.literal('text'),
    tone: Tone.default('cream'),
    heading: z.string().optional(),
    blocks: z
      .array(
        z.discriminatedUnion('kind', [
          z.strictObject({ kind: z.literal('paragraph'), text }),
          z.strictObject({ kind: z.literal('subheading'), text }),
          z.strictObject({ kind: z.literal('list'), items: z.array(text).min(1) }),
        ]),
      )
      .min(1),
  })
  .describe('Plain text page content (privacy policy, about, etc.)')

export const Section = z.discriminatedUnion('type', [
  HeroSection,
  AboutSection,
  SplitSection,
  ProductGridSection,
  ReviewsSection,
  VisitSection,
  GallerySection,
  FaqSection,
  CtaSection,
  TextSection,
])

export const SECTION_TYPES = Section.options.map((o) => o.shape.type.value)

// ── Page ───────────────────────────────────────────────────────────────────────

export const Seo = z.strictObject({
  title: text.max(70).describe('<title> (max ~60 chars recommended)'),
  description: text.max(170).describe('Meta description (max ~155 chars recommended)'),
  ogImage: z.string().optional().describe('Image key for social previews (defaults to site.seo.ogImage)'),
  noindex: z.boolean().default(false),
})

export const Page = z
  .strictObject({
    $schema: z.string().optional(),
    path: z
      .string()
      .regex(/^\/([a-z0-9-]+\/?)*$/, 'lowercase path starting with "/", e.g. "/" or "/o-nas"')
      .describe('URL path of the page. Every file in src/data/pages becomes a pre-rendered route.'),
    seo: Seo,
    sections: z.array(Section).min(1).describe('Ordered list of blocks — reorder, add, remove or disable to change page structure'),
  })
  .superRefine((page, ctx) => {
    const seen = new Set<string>()
    page.sections.forEach((s, i) => {
      if (seen.has(s.id)) ctx.addIssue({ code: 'custom', path: ['sections', i, 'id'], message: `Duplicate section id "${s.id}"` })
      seen.add(s.id)
    })
  })

// ── Products ───────────────────────────────────────────────────────────────────

export const ALLERGENS = [
  'gluten',
  'skorupiaki',
  'jaja',
  'ryby',
  'orzeszki ziemne',
  'soja',
  'mleko',
  'orzechy',
  'seler',
  'gorczyca',
  'sezam',
  'dwutlenek siarki',
  'łubin',
  'mięczaki',
] as const

export const Product = z.strictObject({
  slug: z.string().regex(/^[a-z0-9-]+$/).describe('URL: /produkt/<slug>. Changing it changes the URL.'),
  name: text,
  category: text.describe('Category slug from products.json → categories'),
  price: z.number().positive().nullable().describe('Price in PLN; null = not published'),
  currency: z.literal('PLN').default('PLN'),
  unit: z.enum(['szt', 'kg', 'box']).default('szt'),
  shortDescription: text.max(140).describe('One line for product cards'),
  description: text.describe('Full description for the product page'),
  ingredients: z.array(text).default([]),
  allergens: z.array(z.enum(ALLERGENS)).default([]).describe('EU allergens in Polish (14 regulated allergens)'),
  weight: z.string().optional().describe('e.g. "ok. 250 g"'),
  images: z.array(Image).min(1).describe('First image = card + main photo (cut-out preferred)'),
  available: z.boolean().default(true),
  featured: z.boolean().default(false).describe('Shown where a section uses source.mode = "featured"'),
  badge: z.string().max(20).optional().describe('Small label on the card, e.g. "Bestseller", "Nowość"'),
})

export const Category = z.strictObject({ slug: z.string().regex(/^[a-z0-9-]+$/), name: text })

export const Catalog = z
  .strictObject({
    $schema: z.string().optional(),
    categories: z.array(Category).min(1),
    products: z.array(Product).min(1),
  })
  .superRefine((cat, ctx) => {
    const cats = new Set(cat.categories.map((c) => c.slug))
    const slugs = new Set<string>()
    cat.products.forEach((p, i) => {
      if (slugs.has(p.slug)) ctx.addIssue({ code: 'custom', path: ['products', i, 'slug'], message: `Duplicate slug "${p.slug}"` })
      slugs.add(p.slug)
      if (!cats.has(p.category)) ctx.addIssue({ code: 'custom', path: ['products', i, 'category'], message: `Unknown category "${p.category}"` })
    })
  })

// ── Reviews ────────────────────────────────────────────────────────────────────

export const Review = z.strictObject({
  author: text,
  rating: z.number().int().min(1).max(5),
  text,
  relativeTime: z.string().optional().describe('As shown by Google, e.g. "2 miesiące temu"'),
  publishTime: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])(-\d{2}(T\S+)?)?$/, 'ISO date/time ("2026-10-15T09:30:00Z") or month "YYYY-MM"')
    .optional()
    .describe('When the review was posted: ISO date/time from Google, or "YYYY-MM" when only the month is known. Shown as month + year.'),
  authorPhoto: z.string().url().optional(),
  authorUrl: z.string().url().optional(),
})

export const Reviews = z.strictObject({
  $schema: z.string().optional(),
  source: z.literal('google'),
  rating: z.number().min(1).max(5),
  count: z.number().int().nonnegative(),
  fetchedAt: z.string().describe('ISO date of the last refresh'),
  items: z.array(Review),
})

// ── Site (global settings) ─────────────────────────────────────────────────────

const DAY = z.enum(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
const TIME = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM')
  .describe('24-hour "HH:MM". "closes" must be later than "opens"; closing at midnight is "00:00".')
const HEX = z.string().regex(/^#[0-9a-fA-F]{6}$/, '#RRGGBB')

export const NavLink = z.strictObject({ label: text, href: Href })

/** Fixed interface texts. Every key has a Polish default, so site.json sets only the ones that should change. */
export const Ui = z
  .strictObject({
    product: z
      .strictObject({
        breadcrumbHome: text.default('Strona główna').describe('First breadcrumb on product pages (link to the home page)'),
        catalogLabel: text.default('Smaki').describe('Breadcrumb to the product grid, used when no nav link points at it'),
        unavailable: text.default('Chwilowo niedostępna').describe('Label on product cards and pages when available is false'),
        allergensHeading: text.default('Alergeny'),
        allergyNote: text.default('Masz alergię? Zapytaj obsługę o pełny skład.').describe('Always shown under the allergens'),
        ingredientsHeading: text.default('Skład'),
        otherProductsHeading: z.string().trim().default('Inne smaki').describe('Heading of the other flavours under each product; "" hides that list'),
      })
      .prefault({}),
    notFound: z
      .strictObject({
        title: text.default('Nie znaleziono strony').describe('<title> of the 404 page'),
        description: text.default('Ta strona nie istnieje albo została przeniesiona.').describe('Meta description of the 404 page'),
        heading: text.default('Tu nie ma cynamonek').describe('<h1> of the 404 page'),
        text: text.default('Ta strona nie istnieje albo została przeniesiona.'),
        cta: Cta.default({ label: 'Strona główna', href: '/', variant: 'primary' }),
      })
      .prefault({}),
    reviews: z
      .strictObject({
        sourcePrefix: text.default('Opinie z').describe('Review card label; the word "Google" after it is fixed (attribution required by Google)'),
        countForms: z
          .tuple([text, text, text])
          .default(['opinia', 'opinie', 'opinii'])
          .describe('Review count noun for 1 / 2–4 / 5+ (Polish plural); "w Google" after it is fixed'),
        readMore: text.default('Czytaj całość').describe('Expands a long review'),
        readLess: text.default('Zwiń').describe('Collapses an expanded review'),
      })
      .prefault({}),
    visit: z
      .strictObject({
        address: text.default('Adres'),
        hours: text.default('Godziny otwarcia'),
        phone: text.default('Telefon'),
        openNow: text.default('Otwarte teraz'),
        closedNow: text.default('Zamknięte'),
        closedDay: text.default('nieczynne').describe('Shown instead of hours on closed days'),
        specialHours: text.default('Zmiany w godzinach').describe('Heading above upcoming dates from specialHours (next 14 days)'),
        showMap: text.default('Pokaż mapę'),
        mapNote: text.default('Mapa ładuje się z Google po kliknięciu.').describe('Privacy note under the map button'),
      })
      .prefault({}),
  })
  .prefault({})
  .describe('Interface texts (labels, buttons, notices) of product pages, the 404 page, reviews and the visit section. All optional with Polish defaults.')

export const Site = z.strictObject({
  $schema: z.string().optional(),
  name: text.describe('Brand name used in titles and wordmark'),
  legalName: text.describe('Name as on Google Maps'),
  tagline: text,
  description: text.describe('Business description (used in structured data and defaults)'),
  url: z.string().url().describe('Canonical production URL without trailing slash (env SITE_URL overrides it at build time)'),
  logo: z.strictObject({ wordmark: text, sub: z.string().optional() }),
  contact: z.strictObject({
    phone: z.string().regex(/^\+\d{9,15}$/, 'E.164, e.g. +48511228221'),
    phoneDisplay: text,
    email: z.string().email().optional(),
  }),
  address: z.strictObject({
    street: text,
    postalCode: z.string().regex(/^\d{2}-\d{3}$/),
    city: text,
    district: text,
    country: z.string().length(2).default('PL'),
    entranceNote: text.describe('How to find the entrance'),
    geo: z.strictObject({ lat: z.number(), lng: z.number() }),
  }),
  links: z.strictObject({
    order: z.string().url().describe('Online ordering (Wolt) — target of @order'),
    googleMaps: z.string().url().describe('Place on Google Maps'),
    directions: z.string().url().describe('Route link — target of @directions'),
    reviews: z.string().url().describe('All Google reviews — target of @reviews'),
    writeReview: z.string().url().optional().describe('Google "write a review" form (needs the Place ID; set by npm run reviews:fetch) — target of @writeReview'),
    instagram: z.string().url(),
    facebook: z.string().url().optional(),
    mapEmbed: z.string().url().describe('Google Maps embed URL (loaded on click)'),
  }),
  hours: z
    .array(
      z.union([
        z.strictObject({ days: z.array(DAY).min(1), opens: TIME, closes: TIME }),
        z.strictObject({ days: z.array(DAY).min(1), closed: z.literal(true) }),
      ]),
    )
    .min(1)
    .describe('Regular opening hours'),
  specialHours: z
    .array(
      z.union([
        z.strictObject({ date: z.iso.date(), closed: z.literal(true), note: z.string().optional() }),
        z.strictObject({ date: z.iso.date(), opens: TIME, closes: TIME, note: z.string().optional() }),
      ]),
    )
    .default([])
    .describe('Exceptions to the regular hours for specific dates (holidays, events), e.g. {"date":"2026-11-01","opens":"10:00","closes":"19:00","note":"Wszystkich Świętych"}'),
  hoursNote: z.string().optional(),
  servesCuisine: z.array(text).default([]),
  priceRange: z.string().optional().describe('e.g. "20–40 zł"'),
  nav: z.array(NavLink).max(6),
  header: z.strictObject({ cta: Cta }),
  footer: z.strictObject({
    columns: z.array(z.strictObject({ title: text, links: z.array(NavLink).min(1) })).max(4),
    image: Image,
    note: z.string().optional(),
  }),
  catalog: z.strictObject({
    showPrices: z.boolean().describe('false hides prices everywhere (cards, product pages, structured data)'),
    productCta: Cta.describe('Main button on product pages'),
    secondaryCta: Cta.optional().describe('Second button on product pages (e.g. route to the shop)'),
  }),
  theme: z
    .strictObject({
      colors: z.strictObject({
        cream: HEX.describe('Page background'),
        ink: HEX.describe('Main text (chocolate)'),
        brand: HEX.describe('Signature raspberry pink (display text, accents)'),
        brandDeep: HEX.describe('Darker brand for frames/buttons — must keep ≥4.5:1 contrast with cream'),
        blush: HEX.describe('Soft pink panels'),
        caramel: HEX.describe('Warm yellow accent / stickers'),
      }),
    })
    .describe('Design tokens injected as CSS variables'),
  seo: z.strictObject({
    titleTemplate: z.string().includes('%s').describe('"%s" is replaced with the page title'),
    ogImage: z.string().describe('Default social image key, e.g. "og/default"'),
    keywords: z.array(text).default([]),
  }),
  consent: z.strictObject({
    title: text,
    text: text,
    acceptAll: text,
    rejectAll: text,
    settings: text,
    save: text,
    analyticsLabel: text,
    analyticsText: text,
    marketingLabel: text,
    marketingText: text,
    policyLabel: text,
    policyHref: Href,
    reopenLabel: text.default('Ustawienia cookies').describe('Footer button that reopens the cookie settings'),
  }),
  ui: Ui,
}).superRefine((site, ctx) => {
  const seen = new Set<string>()
  site.hours.forEach((h, i) =>
    h.days.forEach((d) => {
      if (seen.has(d)) ctx.addIssue({ code: 'custom', path: ['hours', i, 'days'], message: `Day "${d}" appears in more than one hours entry` })
      seen.add(d)
    }),
  )
  // Same-day ranges only; "00:00" as closing time means midnight (end of the day)
  const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  const checkRange = (h: { opens: string; closes: string }, path: (string | number)[]) => {
    if ((h.closes === '00:00' ? 24 * 60 : toMinutes(h.closes)) <= toMinutes(h.opens))
      ctx.addIssue({ code: 'custom', path: [...path, 'closes'], message: `"closes" (${h.closes}) must be later than "opens" (${h.opens}); midnight is "00:00"` })
  }
  site.hours.forEach((h, i) => 'opens' in h && checkRange(h, ['hours', i]))
  const dates = new Set<string>()
  site.specialHours.forEach((h, i) => {
    if (dates.has(h.date)) ctx.addIssue({ code: 'custom', path: ['specialHours', i, 'date'], message: `Date "${h.date}" appears in more than one entry` })
    dates.add(h.date)
    if ('opens' in h) checkRange(h, ['specialHours', i])
  })
})

export type CtaT = z.infer<typeof Cta>
export type ImageT = z.infer<typeof Image>
export type SectionT = z.infer<typeof Section>
export type PageT = z.infer<typeof Page>
export type ProductT = z.infer<typeof Product>
export type CatalogT = z.infer<typeof Catalog>
export type ReviewsT = z.infer<typeof Reviews>
export type SiteT = z.infer<typeof Site>
export type ToneT = z.infer<typeof Tone>
export type SectionOf<K extends SectionT['type']> = Extract<SectionT, { type: K }>
