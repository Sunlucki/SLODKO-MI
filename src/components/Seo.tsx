import { Head } from 'vite-react-ssg'
import { localizePath, locales, useContent, type Localized } from '@/content'
import type { PageT } from '@/content/schema'
import { pageUrl, socialImage } from '@/lib/schema-org'

/** Alt text the content gives an image key (product photos, page sections, footer), in the page language. */
function altOf(key: string, { products, pages, site }: Localized): string | undefined {
  const find = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object') return undefined
    const obj = value as Record<string, unknown>
    if (obj.src === key && typeof obj.alt === 'string') return obj.alt
    for (const child of Object.values(obj)) {
      const alt = find(child)
      if (alt) return alt
    }
    return undefined
  }
  return find([products, pages, site])
}

interface Props {
  title: string
  description: string
  /** Path without base and language prefix, e.g. "/" or "/produkt/oreo" */
  path: string
  ogImage?: string
  noindex?: boolean
  /** JSON-LD objects for this page */
  jsonLd?: object[]
}

/**
 * Per-page <head> in the page's language: title, description, robots, canonical, hreflang alternates
 * (every language version + x-default = default language), Open Graph, Twitter, JSON-LD.
 */
export function Seo({ title, description, path, ogImage, noindex, jsonLd = [] }: Props) {
  const c = useContent()
  const { site } = c
  const fullTitle = site.seo.titleTemplate.replace('%s', title)
  const url = pageUrl(c.localize(path))
  const imageKey = ogImage ?? site.seo.ogImage
  const image = socialImage(imageKey)
  // The default social image (og/*) is not shown on any page, so it has no alt text in the content: use the title
  const imageAlt = altOf(imageKey, c) ?? fullTitle
  const ogLocale = locales.find((l) => l.code === c.locale)?.ogLocale
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {/* Indexable pages allow large image previews (Discover, image results); noindex pages get no canonical
          (the two signals contradict each other) and no hreflang */}
      <meta name="robots" content={noindex ? 'noindex,follow' : 'max-image-preview:large'} />
      {!noindex && <link rel="canonical" href={url} />}
      {!noindex &&
        locales.map((l) => <link key={l.code} rel="alternate" hrefLang={l.htmlLang} href={pageUrl(localizePath(path, l.code))} />)}
      {!noindex && <link rel="alternate" hrefLang="x-default" href={pageUrl(path)} />}
      <meta property="og:type" content="website" />
      {ogLocale && <meta property="og:locale" content={ogLocale} />}
      {locales
        .filter((l) => l.code !== c.locale)
        .map((l) => (
          <meta key={l.code} property="og:locale:alternate" content={l.ogLocale} />
        ))}
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {/* Like the canonical: noindex pages name no URL of their own (the 404s are served for any missing URL) */}
      {!noindex && <meta property="og:url" content={url} />}
      <meta property="og:image" content={image.url} />
      <meta property="og:image:width" content={String(image.width)} />
      <meta property="og:image:height" content={String(image.height)} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image.url} />
      <meta name="twitter:image:alt" content={imageAlt} />
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json">
          {/* Escape "<" so content can never close the script tag */}
          {JSON.stringify(data).replace(/</g, '\\u003c')}
        </script>
      ))}
    </Head>
  )
}

/** SEO of a page from src/data/pages (page = its language version, path = default-language path). */
export function PageSeo({ page, jsonLd }: { page: PageT; jsonLd?: object[] }) {
  return <Seo title={page.seo.title} description={page.seo.description} path={page.path} ogImage={page.seo.ogImage} noindex={page.seo.noindex} jsonLd={jsonLd} />
}
